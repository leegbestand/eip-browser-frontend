/**
 * Description of the exploring interpreter protocol.
 * The protocol extends the LSP base protocol(encoding of JSONRPC 2).
 */

export type integer = number;
export type uinteger = number;
export type decimal = number;


export interface Message {
	jsonrpc: string;
}

export interface RequestMessage extends Message {

	/**
	 * The request id.
	 */
	id: integer | string;

	/**
	 * The method to be invoked.
	 */
	method: string;

	/**
	 * The method's params.
	 */
	params?: object;
}

export interface ResponseMessage extends Message {
	/**
	 * The request id.
	 */
	id: integer | string | null;

	/**
	 * The result of a request. This member is REQUIRED on success.
	 * This member MUST NOT exist if there was an error invoking the method.
	 */
	result?: string | number | boolean | object | null;

	/**
	 * The error object in case a request fails.
	 */
	error?: ResponseError;
}

export interface ResponseError {
	/**
	 * A number indicating the error type that occurred.
	 */
	code: integer;

	/**
	 * A string providing a short description of the error.
	 */
	message: string;

	/**
	 * A primitive or structured value that contains additional
	 * information about the error. Can be omitted.
	 */
	data?: string | number | boolean | object | null;
}

// End of base protcol.

/** JSONRPC error code. */
export type ParseError = -32700;
export type InvalidRequest = -32600;
export type MethodNotFound = -32601;
export type InvalidParams = -32602;
export type InternalError = -32603;

/** Our error codes */
export type ReferenceNotInTree = 1;
export type ReferenceRevertInvalid = 2;
export type ProgramParseError = 3;
export type PathNonExisting = 4;

export type DefaultErrorCodes = ParseError | InvalidRequest | MethodNotFound | InvalidParams | InternalError;

export interface DefaultError extends ResponseError {
    code: DefaultErrorCodes;
}

export interface Edge {
    source: uinteger;
    target: uinteger;
    label: EdgeLabel
}

export interface EdgeLabel {
    program: string
    mval: object
}

export interface ExecutionTree {
    current: uinteger;
    references: [uinteger];
    transitions: [Edge]
}

export interface JumpRequest extends RequestMessage {
    method: "jump";
    params: JumpParams;
}

export interface JumpParams {
    reference: uinteger;
}

export interface JumpResponse extends ResponseMessage {
    result?: JumpResult;
    error?: JumpError;
}

export interface JumpResult {
    post?: object;
}

export interface JumpError extends ResponseError {
    code: DefaultErrorCodes | ReferenceNotInTree;
}

export interface RevertRequest extends RequestMessage {
    method: "revert";
    params: RevertParams;
}

export interface RevertParams {
    reference: uinteger;
}

export interface RevertResponse extends ResponseMessage {
    result?: [uinteger]; // References deleted on revert
    error?: RevertError;
}

export interface RevertResult {
    deleted_references: [uinteger];
    post?: object;
}

export interface RevertError extends ResponseError {
    code: DefaultErrorCodes | ReferenceNotInTree | ReferenceRevertInvalid;
}

export interface ExecuteRequest extends RequestMessage {
    method: "execute";
    params: ExecuteParams
}

export interface ExecuteParams {
    program: string;
}

export interface ExecuteResponse extends ResponseMessage {
    result?: ExecuteResult;
    error?: ExecuteError;
}

export interface ExecuteResult {
    reference: uinteger;
    output: object;
    post?: object;
}

export interface ExecuteError extends ResponseError {
    code: DefaultErrorCodes | ProgramParseError
}

export interface DerefRequest extends RequestMessage {
    method: "deref";
    params: DerefParams;
}

export interface DerefParams {
    reference: uinteger;
}

export interface DerefResponse extends ResponseMessage {
    result?: object;
    error?: DerefError
}

export interface DerefError extends ResponseError {
    code: DefaultErrorCodes | ReferenceNotInTree;
}

export interface ExecutionTreeRequest extends RequestMessage {
    method: "getExecutionTree";
}

export interface ExecutionTreeResponse extends ResponseMessage {
    result?: ExecutionTree;
    error?: DefaultError;
}

export interface TraceRequest extends RequestMessage {
    method: "getTrace";
    params?: TraceParams
}

export interface TraceParams {
    reference: uinteger
}

export interface TraceResponse extends ResponseMessage {
    result?: [Edge]
    error?: DefaultError;
}


export interface PathRequest extends RequestMessage {
    method: "getPath"
    params: PathParams
}

export interface PathParams {
    source: uinteger;
    target: uinteger;
}

export interface PathResponse extends ResponseMessage {
    result?: [Edge];
    error?: PathError;
}

export interface PathError extends ResponseError {
    code: DefaultErrorCodes | PathNonExisting;
}

export interface CurrentReferenceRequest extends RequestMessage {
    method: "getCurrentReference"
}

export interface CurrentReferenceResponse extends ResponseMessage {
    result?: uinteger;
    error?: DefaultError;
}

export interface AllReferencesRequest extends RequestMessage {
    method: "getAllReferences"
}

export interface AllReferencesResponse extends ResponseMessage {
    result?: [uinteger];
    error?: DefaultError;
}

export interface LeavesRequest extends RequestMessage {
    method: "getLeaves"
}

export interface LeavesResponse extends ResponseMessage {
    result?: [uinteger];
    error?: LeavesError;
}

export interface LeavesError extends ResponseError {
    code: DefaultErrorCodes | ReferenceNotInTree;
}
