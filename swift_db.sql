-- ============================================================
-- SwiftWheels Fleet Management System
-- Database: swift_db
-- Created By Yves Ty
-- ============================================================

CREATE DATABASE IF NOT EXISTS swift_db;
USE swift_db;

DROP TABLE IF EXISTS Fuel;
DROP TABLE IF EXISTS Trip;
DROP TABLE IF EXISTS Maintenance;
DROP TABLE IF EXISTS Driver;
DROP TABLE IF EXISTS Vehicle;
DROP TABLE IF EXISTS Users;

-- Vehicle Table
CREATE TABLE Vehicle (
    VehicleID INT AUTO_INCREMENT PRIMARY KEY,
    PlateNumber VARCHAR(20) NOT NULL UNIQUE,
    Model VARCHAR(100) NOT NULL,
    Year INT NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Available',
    Mileage INT NOT NULL DEFAULT 0
);

-- Driver Table
CREATE TABLE Driver (
    DriverID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    LicenseNumber VARCHAR(50) NOT NULL UNIQUE,
    Phone VARCHAR(20),
    Address VARCHAR(255)
);

-- Trip Table
CREATE TABLE Trip (
    TripID INT AUTO_INCREMENT PRIMARY KEY,
    VehicleID INT NOT NULL,
    DriverID INT NOT NULL,
    StartLocation VARCHAR(100) NOT NULL,
    Destination VARCHAR(100) NOT NULL,
    TripDate DATE NOT NULL,
    Distance DECIMAL(10,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (VehicleID) REFERENCES Vehicle(VehicleID) ON DELETE CASCADE,
    FOREIGN KEY (DriverID) REFERENCES Driver(DriverID) ON DELETE CASCADE
);

-- Fuel Table
CREATE TABLE Fuel (
    FuelID INT AUTO_INCREMENT PRIMARY KEY,
    VehicleID INT NOT NULL,
    DriverID INT NOT NULL,
    FuelDate DATE NOT NULL,
    Liters DECIMAL(10,2) NOT NULL,
    CostPerLiter DECIMAL(10,2) NOT NULL,
    TotalCost DECIMAL(10,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (VehicleID) REFERENCES Vehicle(VehicleID) ON DELETE CASCADE,
    FOREIGN KEY (DriverID) REFERENCES Driver(DriverID) ON DELETE CASCADE
);

-- Maintenance Table
CREATE TABLE Maintenance (
    MaintenanceID INT AUTO_INCREMENT PRIMARY KEY,
    VehicleID INT NOT NULL,
    ServiceDate DATE NOT NULL,
    Cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    Description TEXT,
    FOREIGN KEY (VehicleID) REFERENCES Vehicle(VehicleID) ON DELETE CASCADE
);

-- Users Table
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    FullName VARCHAR(100) NOT NULL,
    Role VARCHAR(30) NOT NULL DEFAULT 'Driver',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default admin account (password: admin123)
INSERT INTO Users (Username, Password, FullName, Role)
VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'Administrator');

-- Sample Vehicles
INSERT INTO Vehicle (PlateNumber, Model, Year, Status, Mileage) VALUES
('RAB 001A', 'Toyota Hiace', 2020, 'Available', 12000),
('RAB 002B', 'Isuzu Bus', 2019, 'Available', 45000),
('RAB 003C', 'Toyota Land Cruiser', 2021, 'On Trip', 8500),
('RAB 004D', 'Mitsubishi Canter', 2018, 'Under Maintenance', 78000),
('RAB 005E', 'Nissan Patrol', 2022, 'Available', 3200);

-- Sample Drivers
INSERT INTO Driver (FullName, LicenseNumber, Phone, Address) VALUES
('Jean Pierre Nkurunziza', 'LIC-001-2020', '0788100001', 'Kigali, Rwanda'),
('Marie Claire Uwimana', 'LIC-002-2019', '0788100002', 'Butare, Rwanda'),
('Emmanuel Habimana', 'LIC-003-2021', '0788100003', 'Musanze, Rwanda'),
('Alice Mukamana', 'LIC-004-2018', '0788100004', 'Huye, Rwanda'),
('Patrick Bizimungu', 'LIC-005-2022', '0788100005', 'Rubavu, Rwanda');

-- Sample Trips
INSERT INTO Trip (VehicleID, DriverID, StartLocation, Destination, TripDate, Distance) VALUES
(1, 1, 'Kigali', 'Butare', '2026-05-01', 130.5),
(2, 2, 'Butare', 'Musanze', '2026-05-03', 210.0),
(3, 3, 'Kigali', 'Rubavu', '2026-05-05', 160.0),
(1, 4, 'Kigali', 'Huye', '2026-05-10', 140.0);

-- Sample Fuel
INSERT INTO Fuel (VehicleID, DriverID, FuelDate, Liters, CostPerLiter, TotalCost) VALUES
(1, 1, '2026-05-01', 40.0, 1.2, 48.0),
(2, 2, '2026-05-03', 60.0, 1.2, 72.0),
(3, 3, '2026-05-05', 35.0, 1.3, 45.5);

-- Sample Maintenance
INSERT INTO Maintenance (VehicleID, ServiceDate, Cost, Description) VALUES
(4, '2026-05-08', 350.00, 'Engine overhaul and oil change'),
(2, '2026-04-20', 120.00, 'Tire replacement'),
(1, '2026-03-15', 80.00, 'Brake pads replacement');
