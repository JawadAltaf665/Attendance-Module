# Sample JSON Responses for Attendance API Endpoints

## 1. POST /api/attendance/clockin
**Request:**
```json
{
  "employeeId": 101,
  "eventType": "CLOCK_IN",
  "notes": "Starting morning shift",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "source": "Web",
  "deviceId": "WEB-BROWSER-001"
}
```

**Response:**
```json
{
  "id": 5421,
  "employeeId": 101,
  "employeeName": "John Doe",
  "eventType": "CLOCK_IN",
  "eventTime": "2024-01-15T09:00:00Z",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "notes": "Starting morning shift",
  "source": "Web",
  "ipAddress": "192.168.1.100",
  "deviceId": "WEB-BROWSER-001",
  "tenantId": 1,
  "creationTime": "2024-01-15T09:00:00Z",
  "creatorUserId": 101
}
```

## 2. POST /api/attendance/clockout
**Request:**
```json
{
  "employeeId": 101,
  "eventType": "CLOCK_OUT",
  "notes": "End of shift",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "source": "Mobile",
  "deviceId": "MOB-IOS-002"
}
```

**Response:**
```json
{
  "id": 5422,
  "employeeId": 101,
  "employeeName": "John Doe",
  "eventType": "CLOCK_OUT",
  "eventTime": "2024-01-15T17:30:00Z",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "notes": "End of shift",
  "source": "Mobile",
  "ipAddress": "192.168.1.101",
  "deviceId": "MOB-IOS-002",
  "tenantId": 1,
  "creationTime": "2024-01-15T17:30:00Z",
  "creatorUserId": 101
}
```

## 3. GET /api/attendance/events?employeeId=101&start=2024-01-01&end=2024-01-31
**Response:**
```json
[
  {
    "id": 5421,
    "employeeId": 101,
    "employeeName": "John Doe",
    "eventType": "CLOCK_IN",
    "eventTime": "2024-01-15T09:00:00Z",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "notes": "Starting morning shift",
    "source": "Web",
    "tenantId": 1
  },
  {
    "id": 5422,
    "employeeId": 101,
    "employeeName": "John Doe",
    "eventType": "CLOCK_OUT",
    "eventTime": "2024-01-15T17:30:00Z",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "notes": "End of shift",
    "source": "Web",
    "tenantId": 1
  },
  {
    "id": 5423,
    "employeeId": 101,
    "employeeName": "John Doe",
    "eventType": "CLOCK_IN",
    "eventTime": "2024-01-16T08:45:00Z",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "notes": "",
    "source": "Mobile",
    "tenantId": 1
  }
]
```

## 4. GET /api/shifts/roster?employeeId=101&date=2024-01-15
**Response:**
```json
[
  {
    "id": 301,
    "rosterDate": "2024-01-15T00:00:00Z",
    "employeeId": 101,
    "employeeName": "John Doe",
    "shiftId": 1,
    "shiftName": "Morning Shift",
    "shiftStartTime": "09:00:00",
    "shiftEndTime": "17:00:00",
    "tenantId": 1,
    "creationTime": "2024-01-01T10:00:00Z",
    "creatorUserId": 1
  }
]
```

## 5. POST /api/leave/request
**Request:**
```json
{
  "leaveType": "VACATION",
  "startDate": "2024-02-01T00:00:00Z",
  "endDate": "2024-02-05T00:00:00Z",
  "halfDay": false,
  "reason": "Family vacation to Hawaii"
}
```

**Response:**
```json
{
  "id": 801,
  "employeeId": 101,
  "employeeName": "John Doe",
  "leaveType": "VACATION",
  "startDate": "2024-02-01T00:00:00Z",
  "endDate": "2024-02-05T00:00:00Z",
  "halfDay": false,
  "reason": "Family vacation to Hawaii",
  "status": "PENDING",
  "totalDays": 5,
  "tenantId": 1,
  "creationTime": "2024-01-15T14:30:00Z",
  "creatorUserId": 101
}
```

## 6. GET /api/leave/balance?employeeId=101
**Response:**
```json
{
  "employeeId": 101,
  "vacationDaysAvailable": 15,
  "vacationDaysUsed": 3,
  "sickDaysAvailable": 10,
  "sickDaysUsed": 1,
  "unpaidDaysUsed": 0,
  "asOfDate": "2024-01-15T00:00:00Z"
}
```

## 7. GET /api/attendance/GetPagedAttendenceList (Paged Results)
**Request Parameters:**
```
?employeeId=101&startDate=2024-01-01&endDate=2024-01-31&skipCount=0&maxResultCount=10&sorting=eventTime DESC
```

**Response:**
```json
{
  "totalCount": 45,
  "items": [
    {
      "id": 5423,
      "employeeId": 101,
      "employeeName": "John Doe",
      "eventType": "CLOCK_OUT",
      "eventTime": "2024-01-31T17:00:00Z",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "source": "Web",
      "tenantId": 1
    },
    {
      "id": 5422,
      "employeeId": 101,
      "employeeName": "John Doe",
      "eventType": "CLOCK_IN",
      "eventTime": "2024-01-31T09:00:00Z",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "source": "Web",
      "tenantId": 1
    }
  ]
}
```

## 8. GET /api/leave/GetMyLeaves
**Response:**
```json
[
  {
    "id": 801,
    "employeeId": 101,
    "employeeName": "John Doe",
    "leaveType": "VACATION",
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2024-02-05T00:00:00Z",
    "halfDay": false,
    "reason": "Family vacation",
    "status": "APPROVED",
    "approverId": 50,
    "approverName": "Jane Manager",
    "approvedDate": "2024-01-16T10:00:00Z",
    "totalDays": 5,
    "tenantId": 1
  },
  {
    "id": 802,
    "employeeId": 101,
    "employeeName": "John Doe",
    "leaveType": "SICK",
    "startDate": "2024-01-10T00:00:00Z",
    "endDate": "2024-01-10T00:00:00Z",
    "halfDay": true,
    "reason": "Doctor appointment",
    "status": "APPROVED",
    "approverId": 50,
    "approverName": "Jane Manager",
    "approvedDate": "2024-01-09T15:00:00Z",
    "totalDays": 0.5,
    "tenantId": 1
  }
]
```

## Error Response Format
```json
{
  "error": {
    "code": 400,
    "message": "Invalid request parameters",
    "details": "Employee ID is required",
    "validationErrors": [
      {
        "message": "The EmployeeId field is required.",
        "members": ["employeeId"]
      }
    ]
  },
  "success": false,
  "unAuthorizedRequest": false
}
```

## Notes:
- All dates are in ISO 8601 format (UTC)
- Time spans (shift times) are in "HH:mm:ss" format
- Coordinates use decimal degrees
- Employee IDs and other IDs are integers
- Status fields use UPPERCASE enums
- The `tenantId` is handled by ABP framework automatically based on logged-in user's tenant