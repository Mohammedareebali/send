export const serviceConfig = {
  userService: process.env.USER_SERVICE_URL || 'http://localhost:3000',
  runService: process.env.RUN_SERVICE_URL || 'http://localhost:3002',
  studentService: process.env.STUDENT_SERVICE_URL || 'http://localhost:3003',
  driverService: process.env.DRIVER_SERVICE_URL || 'http://localhost:3004',
  vehicleService: process.env.VEHICLE_SERVICE_URL || 'http://localhost:3005',
  documentService: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3006',
  incidentService: process.env.INCIDENT_SERVICE_URL || 'http://localhost:3010',
  invoicingService: process.env.INVOICING_SERVICE_URL || 'http://localhost:3011',
  adminService: process.env.ADMIN_SERVICE_URL || 'http://localhost:3012'
};
