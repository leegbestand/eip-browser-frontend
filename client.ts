/**
 * Implementation of the exploring interpreter protocol on the interface side.
 * It connects via a websocket with an interface server(see ./server) that
 * handles the construction of correct requests to the backend server.
 */

import * as eip from "./eip"
import { io, Socket } from "socket.io-client";
import { toISOString } from "core-js/fn/date";


/** End of protocol definition */

/* Implementation of the interfaces TS side. */
class Message implements eip.Message {
    jsonrpc = "2.0";
}


abstract class RequestMessage extends Message implements eip.RequestMessage {
    id: string;
    method: string;
    params?: object;

    // For now just increase counter. Maybe use UUID or something later?
    static curr_id = 1;

    constructor() {
        super();
        this.id = RequestMessage.curr_id.toString();
        RequestMessage.curr_id++;
    }

    abstract encode(): string;
}

class JumpRequest extends RequestMessage implements eip.JumpRequest {
    method: "jump" = "jump";
    params: eip.JumpParams;
    constructor(params: eip.JumpParams) {
        super();
        this.params = params;
    }

    encode() {
        return JSON.stringify(this);
    }
}

export class JumpParams implements eip.JumpParams {
    reference: eip.uinteger
    constructor(ref: eip.uinteger) {
        this.reference = ref;
    }
}

class ExecuteRequest extends RequestMessage implements eip.ExecuteRequest {
    method: "execute" = "execute";
    params: eip.ExecuteParams;
    constructor(params: eip.ExecuteParams) {
        super();
        this.params = params;
    }

    encode() {
        return JSON.stringify(this);
    }
}

export class ExecuteParams implements eip.ExecuteParams {
    program: string;
    constructor(p: string) {
        this.program = p;
    }
}

class RevertRequest extends RequestMessage implements eip.RevertRequest {
    method: "revert" = "revert";
    params: eip.RevertParams;
    constructor(params: eip.RevertParams) {
        super();
        this.params = params;
    }

    encode() {
        return JSON.stringify(this);
    }
}

export class RevertParams implements eip.RevertParams {
    reference: eip.uinteger
    constructor(ref: eip.uinteger) {
        this.reference = ref;
    }
}

class DerefRequest extends RequestMessage implements eip.DerefRequest {
    method: "deref" = "deref";
    params: eip.DerefParams;
    constructor(params: eip.DerefParams) {
        super();
        this.params = params;
    }

    encode() {
        return JSON.stringify(this);
    }
}

export class DerefParams implements eip.DerefParams {
    reference: eip.uinteger;
    constructor(ref: eip.uinteger) {
        this.reference = ref;
    }
}

class ExecutionTreeRequest  extends RequestMessage implements eip.ExecutionTreeRequest {
    method: "getExecutionTree";
    constructor() {
        super();
        this.method = "getExecutionTree";
    }

    encode() {
        return JSON.stringify(this);
    }
}

class TraceRequest extends RequestMessage implements eip.TraceRequest {
    method: "getTrace" = "getTrace";
    params?: eip.TraceParams;
    constructor(params?: eip.TraceParams) {
        super();
        this.params = params;
    }

    encode() {
        return JSON.stringify(this);
    }
}

export class TraceParams implements eip.TraceParams {
    reference: eip.uinteger;
    constructor(ref: eip.uinteger) {
        this.reference = ref;
    }
}

class PathRequest extends RequestMessage implements eip.PathRequest {
    method: "getPath" = "getPath";
    params: eip.PathParams;
    constructor(params: eip.PathParams) {
        super()
        this.params = params;
    }
    encode() {
        return JSON.stringify(this);
    }
}

class PathParams implements eip.PathParams {
    source: eip.uinteger;
    target: eip.uinteger;
    constructor(source: eip.uinteger, target: eip.uinteger) {
        this.source = source;
        this.target = target;
    }
}

class CurrentReferenceRequest extends RequestMessage implements eip.CurrentReferenceRequest {
    method: "getCurrentReference" = "getCurrentReference";

    constructor() {
        super();
    }

    encode() {
        return JSON.stringify(this);
    }
}

class AllReferencesRequest extends RequestMessage implements eip.AllReferencesRequest {
    method: "getAllReferences" = "getAllReferences";
    constructor() {
        super();
    }

    encode() {
        return JSON.stringify(this);
    }
}

class LeavesRequest extends RequestMessage implements eip.LeavesRequest {
    method: "getLeaves" = "getLeaves";
    constructor() {
        super();
    }

    encode() {
        return JSON.stringify(this);
    }
}

export abstract class EIP {
    socket: Socket;

    requests: Map<string, RequestMessage> = new Map();


    constructor(socket: Socket) {
        this.socket = socket
        socket.on("data", (data) => {
            this.handleResponse(data);
        });
        console.log(this);
    }

    register(req: RequestMessage) {
        this.requests.set(req.id.toString(), req);
    }

    unregister(resp: eip.ResponseMessage): RequestMessage {
        let orig = this.requests.get(resp.id.toString());
        this.requests.delete(resp.id.toString());
        return orig;
    }

    handleResponse(resp: any) {
        let r = JSON.parse(resp) as eip.ResponseMessage;
        if (r.id === "0") {
            this.onUnkownError(r);
            return;
        }
        let req = this.unregister(r);
        if (r.error) {
            this.onError(req, r);
        }

        switch(req.method) {
            case "execute":
                this.onExecute(req as eip.ExecuteRequest, r as eip.ExecuteResponse);
                break;
            case "jump":
                this.onJump(req as eip.JumpRequest, r as eip.JumpResponse);
                break;
            case "revert":
                this.onRevert(req as eip.RevertRequest, r as eip.RevertResponse);
                break;
            case "deref":
                this.onDeref(req as eip.DerefRequest, r as eip.DerefResponse);
                break;
            case "getTrace":
                this.onTrace(req as eip.TraceRequest, r as eip.TraceResponse);
                break;
            case "getExecutionTree":
                this.onExecutionTree(req as eip.ExecutionTreeRequest, r as eip.ExecutionTreeResponse)
                break
            case "getPath":
                this.onPath(req as eip.PathRequest, r as eip.PathResponse);
                break;
            case "getAllReferences":
                this.onAllReferences(req as eip.AllReferencesRequest, r as eip.AllReferencesResponse);
                break;
            case "getCurrentReference":
                this.onCurrentReference(req as eip.CurrentReferenceRequest, r as eip.CurrentReferenceResponse);
                break;
            case "getLeaves":
                this.onLeaves(req as eip.LeavesRequest, resp as eip.LeavesResponse);
                break;
        }
    }

    execute(params: eip.ExecuteParams) {
        this.send(new ExecuteRequest(params));
    }

    jump(params: eip.JumpParams) {
        this.send(new JumpRequest(params))
    }

    revert(params: eip.RevertParams) {
        this.send(new RevertRequest(params));
    }

    deref(params: eip.DerefParams) {
        this.send(new DerefRequest(params));
    }

    getExecutionTree() {
        this.send(new ExecutionTreeRequest());
    }

    getTrace(params?: eip.TraceParams) {
        this.send(new TraceRequest(params));
    }

    getPath(params: eip.PathParams) {
        this.send(new PathRequest(params));
    }

    getCurrentReference() {
        this.send(new CurrentReferenceRequest());
    }

    getAllReferences() {
        this.send(new AllReferencesRequest());
    }

    getLeaves() {
        this.send(new LeavesRequest());
    }

    send(req: RequestMessage) {
        this.register(req);
        this.socket.emit("command", req.encode());
    }

    abstract onExecute(req: eip.ExecuteRequest, resp: eip.ExecuteResponse): void
    abstract onJump(req: eip.JumpRequest, resp: eip.JumpResponse): void
    abstract onRevert(req: eip.RevertRequest, resp: eip.RevertResponse): void
    abstract onDeref (req: eip.DerefRequest, resp: eip.DerefResponse): void
    abstract onExecutionTree(req: eip.ExecutionTreeRequest, resp: eip.ExecutionTreeResponse): void
    abstract onTrace(req: eip.TraceRequest, resp: eip.TraceResponse): void
    abstract onPath(req: eip.PathRequest, resp: eip.PathResponse): void
    abstract onCurrentReference(req: eip.CurrentReferenceRequest, resp: eip.CurrentReferenceResponse): void
    abstract onAllReferences(req: eip.AllReferencesRequest, resp: eip.AllReferencesResponse): void
    abstract onLeaves(req: eip.LeavesRequest, resp: eip.LeavesResponse): void

    abstract onUnkownError(resp: eip.ResponseMessage): void;
    abstract onError(req: eip.RequestMessage, resp: eip.ResponseMessage): void;
}
