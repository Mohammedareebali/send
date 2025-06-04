"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunType = exports.RunStatus = void 0;
var RunStatus;
(function (RunStatus) {
    RunStatus["PENDING"] = "PENDING";
    RunStatus["IN_PROGRESS"] = "IN_PROGRESS";
    RunStatus["COMPLETED"] = "COMPLETED";
    RunStatus["CANCELLED"] = "CANCELLED";
})(RunStatus || (exports.RunStatus = RunStatus = {}));
var RunType;
(function (RunType) {
    RunType["REGULAR"] = "REGULAR";
    RunType["SPECIAL"] = "SPECIAL";
    RunType["EMERGENCY"] = "EMERGENCY";
})(RunType || (exports.RunType = RunType = {}));
