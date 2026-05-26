export class QmpError extends Error {
  readonly code: string;

  constructor(message: string, code = "QMP_ERROR") {
    super(message);
    this.name = "QmpError";
    this.code = code;
  }
}

export class QmpCommandError extends QmpError {
  readonly qmpClass: string;
  readonly description: string;

  constructor(qmpClass: string, description: string) {
    super(`QMP command error [${qmpClass}]: ${description}`, "QMP_COMMAND_ERROR");
    this.name = "QmpCommandError";
    this.qmpClass = qmpClass;
    this.description = description;
  }
}
