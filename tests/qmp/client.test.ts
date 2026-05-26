import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "node:events";

vi.mock("node:net", () => ({ createConnection: vi.fn() }));

import { createConnection } from "node:net";
import { QMPClient } from "../../src/qmp/client.js";
import { QmpCommandError } from "../../src/qmp/errors.js";

class MockSocket extends EventEmitter {
  written: string[] = [];
  write(data: string) { this.written.push(data); return true; }
  destroy() { this.emit("close"); }
  setEncoding(_enc: string) {}
}

function makeClient() {
  return new QMPClient({ socketPath: "/fake.sock" });
}

function sendLines(sock: MockSocket, ...lines: string[]) {
  for (const line of lines) sock.emit("data", line + "\n");
}

async function handshake(sock: MockSocket, connectPromise: Promise<void>) {
  sendLines(sock, JSON.stringify({ QMP: { version: {}, capabilities: [] } }));
  sendLines(sock, JSON.stringify({ return: {} }));
  await connectPromise;
}

describe("QMPClient handshake", () => {
  let mockSock: MockSocket;

  beforeEach(() => {
    mockSock = new MockSocket();
    vi.mocked(createConnection).mockReturnValue(mockSock as unknown as ReturnType<typeof createConnection>);
  });

  afterEach(() => { vi.clearAllMocks(); });

  it("sends qmp_capabilities after greeting", async () => {
    const client = makeClient();
    await handshake(mockSock, client.connect());
    expect(mockSock.written.some((w) => w.includes("qmp_capabilities"))).toBe(true);
    await client.close();
  });

  it("emits connected event after handshake", async () => {
    const client = makeClient();
    const spy = vi.fn();
    client.on("connected", spy);
    await handshake(mockSock, client.connect());
    expect(spy).toHaveBeenCalledOnce();
    await client.close();
  });

  it("rejects connect on socket error", async () => {
    const client = makeClient();
    const promise = client.connect();
    mockSock.emit("error", new Error("ECONNREFUSED"));
    await expect(promise).rejects.toThrow("ECONNREFUSED");
  });
});

describe("QMPClient execute", () => {
  let mockSock: MockSocket;
  let client: QMPClient;

  beforeEach(async () => {
    mockSock = new MockSocket();
    vi.mocked(createConnection).mockReturnValue(mockSock as unknown as ReturnType<typeof createConnection>);
    client = makeClient();
    await handshake(mockSock, client.connect());
  });

  afterEach(async () => {
    await client?.close();
    vi.clearAllMocks();
  });

  it("sends a command and resolves with return value", async () => {
    const p = client.execute<{ running: boolean }>("query-status");
    sendLines(mockSock, JSON.stringify({ return: { running: true, singlestep: false, status: "running" } }));
    expect((await p).running).toBe(true);
  });

  it("rejects with QmpCommandError on error response", async () => {
    const p = client.execute("query-status");
    sendLines(mockSock, JSON.stringify({ error: { class: "CommandNotFound", desc: "not found" } }));
    await expect(p).rejects.toBeInstanceOf(QmpCommandError);
  });

  it("queues multiple commands and processes sequentially", async () => {
    const p1 = client.execute<string>("cmd-one");
    const p2 = client.execute<string>("cmd-two");

    expect(mockSock.written.filter((w) => w.includes("cmd-one"))).toHaveLength(1);
    expect(mockSock.written.filter((w) => w.includes("cmd-two"))).toHaveLength(0);

    sendLines(mockSock, JSON.stringify({ return: "one" }));
    await p1;

    expect(mockSock.written.filter((w) => w.includes("cmd-two"))).toHaveLength(1);
    sendLines(mockSock, JSON.stringify({ return: "two" }));
    expect(await p2).toBe("two");
  });

  it("passes arguments in the command frame", async () => {
    const p = client.execute("stop", { hard: true });
    sendLines(mockSock, JSON.stringify({ return: {} }));
    await p;
    const frame = mockSock.written.find((w) => w.includes("stop") && w.includes("arguments"));
    expect(frame).toBeDefined();
    const parsed = JSON.parse(frame!.trim()) as Record<string, unknown>;
    expect(parsed.arguments).toEqual({ hard: true });
  });
});

describe("QMPClient events", () => {
  let mockSock: MockSocket;
  let client: QMPClient;

  beforeEach(async () => {
    mockSock = new MockSocket();
    vi.mocked(createConnection).mockReturnValue(mockSock as unknown as ReturnType<typeof createConnection>);
    client = makeClient();
    await handshake(mockSock, client.connect());
  });

  afterEach(async () => {
    await client.close();
    vi.clearAllMocks();
  });

  it("emits typed QMP events", () => {
    const spy = vi.fn();
    client.on("SHUTDOWN", spy);
    sendLines(mockSock, JSON.stringify({
      event: "SHUTDOWN",
      data: { guest: false, reason: "host-qmp-quit" },
      timestamp: { seconds: 0, microseconds: 0 },
    }));
    expect(spy).toHaveBeenCalledWith({ guest: false, reason: "host-qmp-quit" });
  });

  it("emits disconnected on socket close", () => {
    const spy = vi.fn();
    client.on("disconnected", spy);
    mockSock.emit("close");
    expect(spy).toHaveBeenCalled();
  });
});

describe("QMPClient AsyncDisposable", () => {
  it("implements Symbol.asyncDispose", () => {
    expect(typeof new QMPClient({ socketPath: "/fake.sock" })[Symbol.asyncDispose]).toBe("function");
  });
});

describe("QMPClient rawEvent", () => {
  let mockSock: MockSocket;
  let client: QMPClient;

  beforeEach(async () => {
    mockSock = new MockSocket();
    vi.mocked(createConnection).mockReturnValue(mockSock as unknown as ReturnType<typeof createConnection>);
    client = new QMPClient({ socketPath: "/fake.sock" });
    await handshake(mockSock, client.connect());
  });

  afterEach(async () => {
    await client.close();
    vi.clearAllMocks();
  });

  it("emits rawEvent with event name, data, and timestamp", () => {
    const spy = vi.fn();
    client.on("rawEvent", spy);
    sendLines(mockSock, JSON.stringify({
      event: "STOP",
      data: {},
      timestamp: { seconds: 1700000000, microseconds: 123456 },
    }));
    expect(spy).toHaveBeenCalledWith({
      event: "STOP",
      data: {},
      timestamp: { seconds: 1700000000, microseconds: 123456 },
    });
  });

  it("emits both the typed event and rawEvent", () => {
    const typedSpy = vi.fn();
    const rawSpy = vi.fn();
    client.on("RESUME", typedSpy);
    client.on("rawEvent", rawSpy);
    sendLines(mockSock, JSON.stringify({
      event: "RESUME",
      data: {},
      timestamp: { seconds: 1700000000, microseconds: 0 },
    }));
    expect(typedSpy).toHaveBeenCalledOnce();
    expect(rawSpy).toHaveBeenCalledOnce();
  });
});

describe("QMPClient OOB", () => {
  let mockSock: MockSocket;
  let client: QMPClient;

  beforeEach(async () => {
    mockSock = new MockSocket();
    vi.mocked(createConnection).mockReturnValue(mockSock as unknown as ReturnType<typeof createConnection>);
    client = new QMPClient({ socketPath: "/fake.sock", oob: true });
    await handshake(mockSock, client.connect());
  });

  afterEach(async () => {
    await client.close();
    vi.clearAllMocks();
  });

  it("negotiates OOB in qmp_capabilities", () => {
    const capFrame = mockSock.written.find((w) => w.includes("qmp_capabilities"));
    expect(capFrame).toBeDefined();
    const parsed = JSON.parse(capFrame!.trim()) as Record<string, unknown>;
    expect((parsed.arguments as Record<string, unknown>)?.enable).toContain("oob");
  });

  it("executeOob sends command with control run-oob and id", async () => {
    const p = client.executeOob<{ running: boolean }>("query-status");
    const frame = mockSock.written.find((w) => w.includes("query-status") && w.includes("run-oob"));
    expect(frame).toBeDefined();
    const parsed = JSON.parse(frame!.trim()) as Record<string, unknown>;
    expect((parsed.control as Record<string, unknown>)?.["run-oob"]).toBe(true);
    expect(parsed.id).toBeDefined();

    // Send back response with matching id
    sendLines(mockSock, JSON.stringify({ id: (parsed.id as string), return: { running: true } }));
    expect((await p).running).toBe(true);
  });

  it("executeOob resolves independently of normal queue", async () => {
    // Inflight a normal command
    const normal = client.execute<string>("slow-command");

    // OOB should still resolve without waiting for the normal command
    const oob = client.executeOob<{ running: boolean }>("query-status");
    const oobFrame = mockSock.written.find((w) => w.includes("query-status") && w.includes("run-oob"))!;
    const oobParsed = JSON.parse(oobFrame.trim()) as Record<string, unknown>;

    // Resolve OOB first
    sendLines(mockSock, JSON.stringify({ id: oobParsed.id, return: { running: true } }));
    expect((await oob).running).toBe(true);

    // Normal command still pending — resolve it
    sendLines(mockSock, JSON.stringify({ return: "done" }));
    expect(await normal).toBe("done");
  });
});
