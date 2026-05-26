import { createConnection as e } from "node:net";
import { EventEmitter as t } from "node:events";
import { execFile as n, spawn as r } from "node:child_process";
import { rm as i, writeFile as a } from "node:fs/promises";
import { promisify as o } from "node:util";
//#region src/qmp/commands.ts
var s = class extends t {
	queryStatus() {
		return this.execute("query-status");
	}
	stop() {
		return this.execute("stop").then(() => void 0);
	}
	cont() {
		return this.execute("cont").then(() => void 0);
	}
	systemReset() {
		return this.execute("system_reset").then(() => void 0);
	}
	systemPowerdown() {
		return this.execute("system_powerdown").then(() => void 0);
	}
	quit() {
		return this.execute("quit").then(() => void 0);
	}
	setAction(e) {
		return this.execute("set-action", e).then(() => void 0);
	}
	queryBlock() {
		return this.execute("query-block");
	}
	queryBlockStats() {
		return this.execute("query-blockstats");
	}
	queryBlockJobs() {
		return this.execute("query-block-jobs");
	}
	queryNamedBlockNodes() {
		return this.execute("query-named-block-nodes");
	}
	blockdevBackup(e) {
		return this.execute("blockdev-backup", e).then(() => void 0);
	}
	blockdevMirror(e) {
		return this.execute("blockdev-mirror", e).then(() => void 0);
	}
	blockStream(e) {
		return this.execute("block-stream", e).then(() => void 0);
	}
	blockCommit(e) {
		return this.execute("block-commit", e).then(() => void 0);
	}
	blockJobSetSpeed(e, t) {
		return this.execute("block-job-set-speed", {
			device: e,
			speed: t
		}).then(() => void 0);
	}
	blockJobPause(e) {
		return this.execute("block-job-pause", { device: e }).then(() => void 0);
	}
	blockJobResume(e) {
		return this.execute("block-job-resume", { device: e }).then(() => void 0);
	}
	blockJobCancel(e, t) {
		return this.execute("block-job-cancel", {
			device: e,
			...t != null && { force: t }
		}).then(() => void 0);
	}
	blockJobComplete(e) {
		return this.execute("block-job-complete", { device: e }).then(() => void 0);
	}
	jobPause(e) {
		return this.execute("job-pause", { id: e }).then(() => void 0);
	}
	jobResume(e) {
		return this.execute("job-resume", { id: e }).then(() => void 0);
	}
	jobCancel(e) {
		return this.execute("job-cancel", { id: e }).then(() => void 0);
	}
	jobComplete(e) {
		return this.execute("job-finalize", { id: e }).then(() => void 0);
	}
	jobDismiss(e) {
		return this.execute("job-dismiss", { id: e }).then(() => void 0);
	}
	queryJobs() {
		return this.execute("query-jobs");
	}
	snapshotSave(e) {
		return this.execute("snapshot-save", e).then(() => void 0);
	}
	snapshotLoad(e) {
		return this.execute("snapshot-load", e).then(() => void 0);
	}
	snapshotDelete(e) {
		return this.execute("snapshot-delete", e).then(() => void 0);
	}
	blockDirtyBitmapAdd(e) {
		return this.execute("block-dirty-bitmap-add", e).then(() => void 0);
	}
	blockDirtyBitmapRemove(e) {
		return this.execute("block-dirty-bitmap-remove", e).then(() => void 0);
	}
	blockDirtyBitmapClear(e) {
		return this.execute("block-dirty-bitmap-clear", e).then(() => void 0);
	}
	blockDirtyBitmapEnable(e) {
		return this.execute("block-dirty-bitmap-enable", e).then(() => void 0);
	}
	blockDirtyBitmapDisable(e) {
		return this.execute("block-dirty-bitmap-disable", e).then(() => void 0);
	}
	blockDirtyBitmapMerge(e) {
		return this.execute("block-dirty-bitmap-merge", e).then(() => void 0);
	}
	transaction(e) {
		return this.execute("transaction", { actions: e }).then(() => void 0);
	}
	deviceAdd(e) {
		return this.execute("device_add", e).then(() => void 0);
	}
	deviceDel(e) {
		return this.execute("device_del", { id: e }).then(() => void 0);
	}
	netdevAdd(e) {
		return this.execute("netdev_add", e).then(() => void 0);
	}
	netdevDel(e) {
		return this.execute("netdev_del", { id: e }).then(() => void 0);
	}
	setLink(e, t) {
		return this.execute("set_link", {
			name: e,
			up: t
		}).then(() => void 0);
	}
	queryHotpluggableCpus() {
		return this.execute("query-hotpluggable-cpus");
	}
	queryMemoryDevices() {
		return this.execute("query-memory-devices");
	}
	migrate(e) {
		return this.execute("migrate", e).then(() => void 0);
	}
	migrateIncoming(e) {
		return this.execute("migrate-incoming", { uri: e }).then(() => void 0);
	}
	migrateCancel() {
		return this.execute("migrate_cancel").then(() => void 0);
	}
	migratePause() {
		return this.execute("migrate-pause").then(() => void 0);
	}
	migrateContinue(e) {
		return this.execute("migrate-continue", { state: e }).then(() => void 0);
	}
	migrateStartPostcopy() {
		return this.execute("migrate-start-postcopy").then(() => void 0);
	}
	migrateSetCapabilities(e) {
		return this.execute("migrate-set-capabilities", { capabilities: e }).then(() => void 0);
	}
	migrateSetParameters(e) {
		return this.execute("migrate-set-parameters", e).then(() => void 0);
	}
	queryMigrate() {
		return this.execute("query-migrate");
	}
	queryMigrateCapabilities() {
		return this.execute("query-migrate-capabilities");
	}
	queryMigrateParameters() {
		return this.execute("query-migrate-parameters");
	}
	queryCpusFast() {
		return this.execute("query-cpus-fast");
	}
	queryMemdev() {
		return this.execute("query-memdev");
	}
	queryMemorySizeSummary() {
		return this.execute("query-memory-size-summary");
	}
	queryKvm() {
		return this.execute("query-kvm");
	}
	queryVnc() {
		return this.execute("query-vnc");
	}
	setPassword(e) {
		return this.execute("set_password", e).then(() => void 0);
	}
	expirePassword(e) {
		return this.execute("expire_password", e).then(() => void 0);
	}
	screendump(e) {
		return this.execute("screendump", e).then(() => void 0);
	}
	queryChardev() {
		return this.execute("query-chardev");
	}
	ringbufWrite(e) {
		return this.execute("ringbuf-write", e).then(() => void 0);
	}
	ringbufRead(e) {
		return this.execute("ringbuf-read", e);
	}
	queryVersion() {
		return this.execute("query-version");
	}
	queryCommands() {
		return this.execute("query-commands");
	}
	queryQmpSchema() {
		return this.execute("query-qmp-schema");
	}
	qomList(e) {
		return this.execute("qom-list", { path: e });
	}
	qomGet(e, t) {
		return this.execute("qom-get", {
			path: e,
			property: t
		});
	}
	qomSet(e, t, n) {
		return this.execute("qom-set", {
			path: e,
			property: t,
			value: n
		}).then(() => void 0);
	}
	qomListTypes(e) {
		return this.execute("qom-list-types", e);
	}
	qomListProperties(e) {
		return this.execute("device-list-properties", { typename: e });
	}
	queryUuid() {
		return this.execute("query-uuid");
	}
	queryName() {
		return this.execute("query-name");
	}
	objectAdd(e) {
		return this.execute("object-add", e).then(() => void 0);
	}
	objectDel(e) {
		return this.execute("object-del", { id: e }).then(() => void 0);
	}
	chardevAdd(e) {
		return this.execute("chardev-add", e);
	}
	chardevChange(e) {
		return this.execute("chardev-change", e).then(() => void 0);
	}
	chardevRemove(e) {
		return this.execute("chardev-remove", { id: e }).then(() => void 0);
	}
	queryIothreads() {
		return this.execute("query-iothreads");
	}
	dumpGuestMemory(e) {
		return this.execute("dump-guest-memory", e).then(() => void 0);
	}
	addClient(e) {
		return this.execute("add_client", e).then(() => void 0);
	}
	queryDisplayOptions() {
		return this.execute("query-display-options");
	}
	humanMonitorCommand(e) {
		return this.execute("human-monitor-command", { "command-line": e });
	}
}, c = class extends Error {
	code;
	constructor(e, t = "QMP_ERROR") {
		super(e), this.name = "QmpError", this.code = t;
	}
}, l = class extends c {
	qmpClass;
	description;
	constructor(e, t) {
		super(`QMP command error [${e}]: ${t}`, "QMP_COMMAND_ERROR"), this.name = "QmpCommandError", this.qmpClass = e, this.description = t;
	}
}, u = class extends s {
	opts;
	socket = null;
	buf = "";
	queue = [];
	inflight = null;
	ready = !1;
	closed = !1;
	handshakeResolve = null;
	handshakeReject = null;
	awaitingCapReply = !1;
	reconnectAttempt = 0;
	reconnectDelay;
	reconnectMaxDelay;
	pendingOob = /* @__PURE__ */ new Map();
	oobSeq = 0;
	constructor(e) {
		super(), this.opts = e, this.reconnectDelay = e.reconnectDelay ?? 1e3, this.reconnectMaxDelay = e.reconnectMaxDelay ?? 3e4;
	}
	async connect() {
		if (this.closed) throw new c("Client is closed", "CLIENT_CLOSED");
		if (this.socket) throw new c("Already connected", "ALREADY_CONNECTED");
		return new Promise((e, t) => {
			this.handshakeResolve = e, this.handshakeReject = t, this.createSocket();
		});
	}
	createSocket() {
		let t = this.opts.socketPath == null ? e({
			host: this.opts.host ?? "127.0.0.1",
			port: this.opts.port ?? 4444
		}) : e(this.opts.socketPath);
		this.socket = t, t.setEncoding("utf8"), t.on("data", (e) => this.onData(e)), t.on("error", (e) => {
			if (this.handshakeReject) {
				let t = this.handshakeReject;
				this.handshakeResolve = null, this.handshakeReject = null, t(e);
			} else this.emit("error", e);
		}), t.on("close", () => {
			this.ready = !1, this.inflight &&= (this.inflight.reject(new c("Connection closed", "CONNECTION_CLOSED")), null);
			for (let { entry: e } of this.queue) e.reject(new c("Connection closed", "CONNECTION_CLOSED"));
			this.queue = [];
			for (let e of this.pendingOob.values()) e.reject(new c("Connection closed", "CONNECTION_CLOSED"));
			this.pendingOob.clear(), this.closed || (this.emit("disconnected"), this.scheduleReconnect()), this.socket = null, this.buf = "", this.awaitingCapReply = !1;
		});
	}
	onData(e) {
		this.buf += e;
		let t;
		for (; (t = this.buf.indexOf("\n")) !== -1;) {
			let e = this.buf.slice(0, t).trim();
			if (this.buf = this.buf.slice(t + 1), !e) continue;
			let n;
			try {
				n = JSON.parse(e);
			} catch {
				continue;
			}
			this.dispatch(n);
		}
	}
	dispatch(e) {
		if ("QMP" in e) {
			let e = this.opts.oob ? { arguments: { enable: ["oob"] } } : {};
			this.awaitingCapReply = !0, this.socket.write(JSON.stringify({
				execute: "qmp_capabilities",
				...e
			}) + "\r\n");
			return;
		}
		if ("event" in e) {
			let t = e;
			this.emit(t.event, t.data ?? {}), this.emit("rawEvent", {
				event: t.event,
				data: t.data ?? {},
				timestamp: t.timestamp
			});
			return;
		}
		if ("return" in e || "error" in e) {
			let t = e;
			if (t.id !== void 0 && this.pendingOob.has(t.id)) {
				let e = this.pendingOob.get(t.id);
				this.pendingOob.delete(t.id), t.error ? e.reject(new l(t.error.class, t.error.desc)) : e.resolve(t.return);
				return;
			}
			if (this.awaitingCapReply) {
				this.awaitingCapReply = !1, this.ready = !0, this.reconnectAttempt = 0;
				let e = this.handshakeResolve;
				this.handshakeResolve = null, this.handshakeReject = null, this.emit("connected"), e?.(), this.flush();
				return;
			}
			let n = this.inflight;
			if (this.inflight = null, !n) return;
			t.error ? n.reject(new l(t.error.class, t.error.desc)) : n.resolve(t.return), this.flush();
		}
	}
	flush() {
		if (this.inflight || !this.ready || this.queue.length === 0 || !this.socket) return;
		let e = this.queue.shift();
		this.inflight = e.entry;
		let t = { execute: e.cmd };
		e.args !== void 0 && (t.arguments = e.args), this.socket.write(JSON.stringify(t) + "\r\n");
	}
	execute(e, t) {
		return this.closed ? Promise.reject(new c("Client is closed", "CLIENT_CLOSED")) : new Promise((n, r) => {
			this.queue.push({
				cmd: e,
				args: t,
				entry: {
					resolve: n,
					reject: r
				}
			}), this.flush();
		});
	}
	executeOob(e, t) {
		return this.closed ? Promise.reject(new c("Client is closed", "CLIENT_CLOSED")) : this.ready ? new Promise((n, r) => {
			let i = `oob-${++this.oobSeq}`;
			this.pendingOob.set(i, {
				resolve: n,
				reject: r
			});
			let a = {
				execute: e,
				id: i,
				control: { "run-oob": !0 }
			};
			t !== void 0 && (a.arguments = t), this.socket.write(JSON.stringify(a) + "\r\n");
		}) : Promise.reject(new c("Not connected", "NOT_CONNECTED"));
	}
	async close() {
		this.closed = !0, this.ready = !1, this.socket &&= (this.socket.destroy(), null);
	}
	async [Symbol.asyncDispose]() {
		await this.close();
	}
	scheduleReconnect() {
		if (!this.opts.reconnect || this.closed) return;
		let e = Math.min(this.reconnectDelay * 2 ** this.reconnectAttempt, this.reconnectMaxDelay);
		this.reconnectAttempt++, setTimeout(() => {
			this.closed || this.createSocket();
		}, e);
	}
};
//#endregion
//#region src/process/args.ts
function d(e) {
	let t = [];
	if (e.enableKvm && t.push("-enable-kvm"), e.machine) {
		let n = e.machine.type;
		e.machine.accel && (n += `,accel=${e.machine.accel}`), e.machine.kernelIrqchip && (n += `,kernel_irqchip=${e.machine.kernelIrqchip}`), t.push("-machine", n);
	}
	if (e.cpu && t.push("-cpu", e.cpu), e.smp != null) if (typeof e.smp == "number") t.push("-smp", String(e.smp));
	else {
		let n = [];
		e.smp.cpus != null && n.push(`cpus=${e.smp.cpus}`), e.smp.cores != null && n.push(`cores=${e.smp.cores}`), e.smp.threads != null && n.push(`threads=${e.smp.threads}`), e.smp.sockets != null && n.push(`sockets=${e.smp.sockets}`), e.smp.maxCpus != null && n.push(`maxcpus=${e.smp.maxCpus}`), n.length > 0 && t.push("-smp", n.join(","));
	}
	if (e.memory && t.push("-m", String(e.memory.size)), e.noReboot && t.push("-no-reboot"), e.noShutdown && t.push("-no-shutdown"), e.daemonize && t.push("-daemonize"), e.pidfile && t.push("-pidfile", e.pidfile), e.qmp) {
		let n = "socketPath" in e.qmp ? `unix:${e.qmp.socketPath},server=on,wait=off` : `tcp:${e.qmp.host}:${e.qmp.port},server=on,wait=off`;
		t.push("-qmp", n);
	}
	for (let n of e.drives ?? []) {
		let e = [`file=${n.file}`, `format=${n.format ?? "raw"}`];
		n.id && e.push(`id=${n.id}`), n.media && e.push(`media=${n.media}`), n.cache && e.push(`cache=${n.cache}`), n.aio && e.push(`aio=${n.aio}`), n.readonly && e.push("readonly=on"), n.discard && e.push(`discard=${n.discard}`), t.push("-drive", e.join(",")), n.virtio && t.push("-device", `virtio-blk-pci,drive=${n.id ?? n.file}`);
	}
	for (let n of e.net ?? []) f(t, n);
	if (e.vnc) {
		let n = e.vnc.display;
		e.vnc.password && (n += ",password=on"), t.push("-vnc", n);
	}
	if (e.spice) {
		let n = [];
		e.spice.port != null && n.push(`port=${e.spice.port}`), e.spice.host && n.push(`addr=${e.spice.host}`), e.spice.password && n.push(`password=${e.spice.password}`), e.spice.disableTicketing && n.push("disable-ticketing=on"), n.length > 0 && t.push("-spice", n.join(","));
	}
	return e.serial && t.push("-serial", e.serial), e.monitor && t.push("-monitor", e.monitor), e.extraArgs && t.push(...e.extraArgs), t;
}
function f(e, t) {
	if (t.type === "none") {
		e.push("-nic", "none");
		return;
	}
	let n = t.id ?? "net0";
	if (t.type === "tap") {
		let r = ["tap", `id=${n}`];
		t.ifname && r.push(`ifname=${t.ifname}`), t.script && r.push(`script=${t.script}`), t.downscript && r.push(`downscript=${t.downscript}`), t.vhost && r.push("vhost=on"), e.push("-netdev", r.join(","));
	} else if (t.type === "user") {
		let r = ["user", `id=${n}`];
		for (let e of t.hostfwd ?? []) r.push(`hostfwd=${e}`);
		e.push("-netdev", r.join(","));
	} else if (t.type === "bridge") {
		let r = ["bridge", `id=${n}`];
		t.br && r.push(`br=${t.br}`), e.push("-netdev", r.join(","));
	}
	let r = "mac" in t && t.mac ? `,mac=${t.mac}` : "";
	e.push("-device", `virtio-net-pci,netdev=${n}${r}`);
}
//#endregion
//#region src/process/manager.ts
var p = class extends t {
	binary;
	config;
	proc = null;
	constructor(e) {
		super(), this.binary = e.binary ?? "qemu-system-x86_64", this.config = e.config;
	}
	get pid() {
		return this.proc?.pid;
	}
	get socketPath() {
		if (this.config.qmp && "socketPath" in this.config.qmp) return this.config.qmp.socketPath;
	}
	async start() {
		if (this.proc) throw Error("Process already started");
		let e = d(this.config), t = r(this.binary, e, { stdio: [
			"ignore",
			"pipe",
			"pipe"
		] });
		this.proc = t, this.config.pidfile && t.pid != null && await a(this.config.pidfile, String(t.pid), "utf8"), t.stdout?.on("data", (e) => this.emit("stdout", e.toString("utf8"))), t.stderr?.on("data", (e) => this.emit("stderr", e.toString("utf8"))), t.on("exit", (e, t) => {
			this.proc = null, this.config.pidfile && i(this.config.pidfile, { force: !0 }).catch(() => {}), this.emit("exit", e, t);
		}), t.on("error", (e) => this.emit("error", e));
	}
	async stop(e = 5e3) {
		if (this.proc) return new Promise((t) => {
			let n = this.proc, r = setTimeout(() => n.kill("SIGKILL"), e);
			n.once("exit", () => {
				clearTimeout(r), t();
			}), n.kill("SIGTERM");
		});
	}
	async kill() {
		if (this.proc) return new Promise((e) => {
			this.proc.once("exit", e), this.proc.kill("SIGKILL");
		});
	}
	async [Symbol.asyncDispose]() {
		await this.stop();
	}
}, m = { execFile: o(n) };
function h(e) {
	return {
		id: e.id,
		name: e.name,
		vmStateSize: e["vm-state-size"],
		dateSec: e["date-sec"],
		dateNsec: e["date-nsec"],
		vmClockSec: e["vm-clock-sec"],
		vmClockNsec: e["vm-clock-nsec"]
	};
}
var g = class {
	static async create(e) {
		let t = ["create"];
		e.format && t.push("-f", e.format), e.backingFile && (t.push("-b", e.backingFile), e.backingFormat && t.push("-F", e.backingFormat)), t.push(e.filename, e.size), await m.execFile("qemu-img", t);
	}
	static async resize(e) {
		let t = ["resize"];
		e.format && t.push("-f", e.format), e.preallocation && t.push("--preallocation", e.preallocation), t.push(e.filename, e.size), await m.execFile("qemu-img", t);
	}
	static async convert(e) {
		let t = ["convert"];
		e.srcFormat && t.push("-f", e.srcFormat), e.format && t.push("-O", e.format), e.compress && t.push("-c"), e.sparse && t.push("-S", "0"), t.push(e.src, e.dst), await m.execFile("qemu-img", t);
	}
	static async info(e) {
		let { stdout: t } = await m.execFile("qemu-img", [
			"info",
			"--output=json",
			e.filename
		]), n = JSON.parse(t);
		return {
			filename: n.filename,
			format: n.format,
			virtualSize: n["virtual-size"],
			diskSize: n["actual-size"] ?? n["disk-size"] ?? 0,
			clusterSize: n["cluster-size"],
			backingFile: n["backing-filename"],
			backingFormat: n["backing-filename-format"],
			snapshots: (n.snapshots ?? []).map(h)
		};
	}
	static async check(e) {
		let t = ["check"];
		e.format && t.push("-f", e.format), e.repair && t.push("-r", "all"), t.push(e.filename), await m.execFile("qemu-img", t);
	}
	static async snapshotCreate(e) {
		await m.execFile("qemu-img", [
			"snapshot",
			"-c",
			e.tag,
			e.filename
		]);
	}
	static async snapshotApply(e) {
		await m.execFile("qemu-img", [
			"snapshot",
			"-a",
			e.tag,
			e.filename
		]);
	}
	static async snapshotDelete(e) {
		await m.execFile("qemu-img", [
			"snapshot",
			"-d",
			e.tag,
			e.filename
		]);
	}
	static async snapshotList(e) {
		let { stdout: t } = await m.execFile("qemu-img", [
			"info",
			"--output=json",
			e.filename
		]);
		return (JSON.parse(t).snapshots ?? []).map(h);
	}
};
//#endregion
export { u as QMPClient, g as QemuImg, p as QemuProcess, l as QmpCommandError, c as QmpError, d as buildArgs };

//# sourceMappingURL=index.es.map