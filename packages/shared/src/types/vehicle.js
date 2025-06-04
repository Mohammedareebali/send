"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertStatus = exports.AlertSeverity = exports.AlertType = exports.VehicleEventType = exports.VehicleType = exports.VehicleStatus = void 0;
var VehicleStatus;
(function (VehicleStatus) {
    VehicleStatus["AVAILABLE"] = "AVAILABLE";
    VehicleStatus["IN_USE"] = "IN_USE";
    VehicleStatus["MAINTENANCE"] = "MAINTENANCE";
    VehicleStatus["OUT_OF_SERVICE"] = "OUT_OF_SERVICE";
})(VehicleStatus || (exports.VehicleStatus = VehicleStatus = {}));
var VehicleType;
(function (VehicleType) {
    VehicleType["SEDAN"] = "SEDAN";
    VehicleType["SUV"] = "SUV";
    VehicleType["VAN"] = "VAN";
    VehicleType["BUS"] = "BUS";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
var VehicleEventType;
(function (VehicleEventType) {
    VehicleEventType["VEHICLE_CREATED"] = "VEHICLE_CREATED";
    VehicleEventType["VEHICLE_UPDATED"] = "VEHICLE_UPDATED";
    VehicleEventType["VEHICLE_DELETED"] = "VEHICLE_DELETED";
    VehicleEventType["VEHICLE_STATUS_CHANGED"] = "VEHICLE_STATUS_CHANGED";
    VehicleEventType["VEHICLE_ASSIGNED"] = "VEHICLE_ASSIGNED";
    VehicleEventType["VEHICLE_UNASSIGNED"] = "VEHICLE_UNASSIGNED";
    VehicleEventType["MAINTENANCE_RECORD_ADDED"] = "MAINTENANCE_RECORD_ADDED";
})(VehicleEventType || (exports.VehicleEventType = VehicleEventType = {}));
var AlertType;
(function (AlertType) {
    AlertType["MAINTENANCE"] = "MAINTENANCE";
    AlertType["SAFETY"] = "SAFETY";
    AlertType["PERFORMANCE"] = "PERFORMANCE";
    AlertType["FUEL"] = "FUEL";
    AlertType["INSURANCE"] = "INSURANCE";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "LOW";
    AlertSeverity["MEDIUM"] = "MEDIUM";
    AlertSeverity["HIGH"] = "HIGH";
    AlertSeverity["CRITICAL"] = "CRITICAL";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "ACTIVE";
    AlertStatus["RESOLVED"] = "RESOLVED";
    AlertStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
