CREATE DATABASE IF NOT EXISTS EcoTechBackend;
use ecotechbackend;

CREATE TABLE IF NOT EXISTS Status (
  value ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL
);

CREATE TABLE IF NOT EXISTS Role (
  value ENUM('USER', 'ADMIN') NOT NULL
);

CREATE TABLE User (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('USER', 'ADMIN') DEFAULT 'USER' NOT NULL,
  phone_number VARCHAR(20),
  address VARCHAR(255),
  imageUrl VARCHAR(255),
  imageId VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  points INT DEFAULT 0 NOT NULL
);

CREATE TABLE RecycleItem (
  id INT AUTO_INCREMENT PRIMARY KEY,
  itemType VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  item_condition VARCHAR(255) NOT NULL,
  weight INT NOT NULL,
  imageUrl VARCHAR(255),
  imageId VARCHAR(255),
  userId INT,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE PickupRequest (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  pickupAddress VARCHAR(255) NOT NULL,
  pickupDate VARCHAR(255) NOT NULL,
  pickupTime VARCHAR(255) NOT NULL,
  itemsForPickup TEXT NOT NULL,
  specialInstructions TEXT,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE Session (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  userId INT NOT NULL,
  sessionId VARCHAR(255) UNIQUE NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expiresAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE Reward (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  points INT NOT NULL,
  imageUrl VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE Redemption (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  rewardId INT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (rewardId) REFERENCES Reward(id)
);

INSERT INTO Reward (id, name, description, points, imageUrl, createdAt, updatedAt)
VALUES
    (1, 'Plastic Bag', 'Plastic Suck let the moto live', 200, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKTrbsw0iUD8_4vXw9DZwAp0SBS6hUzziSGQ&s', NOW(), NOW()),
    (2, 'Awareness Session', 'Donate a free session to remote areas', 750, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3Gk1nPTmSudjHgXR1jmGRBKCuBAwwbMFPuA&s', NOW(), NOW()),
    (3, 'Recycle 50ft ocean', 'Recycle 50ft ocean', 1500, 'https://www.shutterstock.com/image-photo/household-electrical-scrapped-electronic-devices-260nw-2223131779.jpg', NOW(), NOW()),
    (4, 'Donate Recycle Item', 'Donate Recycle Item', 500, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSiSvEVm3ezZoNAd5fSx3JXVpb-Lmtid5TtZA&s', NOW(), NOW()),
    (5, 'Recycled Utensils', 'Recycled Utensils', 2000, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHK7ozxZQqWyW7h_PzyqbhLBOHMJ3aV2OEXw&s', NOW(), NOW());

select * from user;
select * from session;
select * from recycleItem;
select * from reward;
select * from redemption;
select * from pickuprequest;