export declare class QmpError extends Error {
    readonly code: string;
    constructor(message: string, code?: string);
}
export declare class QmpCommandError extends QmpError {
    readonly qmpClass: string;
    readonly description: string;
    constructor(qmpClass: string, description: string);
}
//# sourceMappingURL=errors.d.ts.map