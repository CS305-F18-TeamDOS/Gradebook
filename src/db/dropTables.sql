--dropTables.sql - GradeBook

--Zaid Bhujwala, Zach Boylan, Steven Rollo, Sean Murthy
--Data Science & Systems Lab (DASSL), Western Connecticut State University (WCSU)

--Edited by Team DOS: Kyle Bella, Kenneth Kozlowski, Joe Tether
--Edited for CS305-71
--Date of Revision: 10/31/2018


--(C) 2017- DASSL. ALL RIGHTS RESERVED.
--Licensed to others under CC 4.0 BY-SA-NC
--https://creativecommons.org/licenses/by-nc-sa/4.0/

--PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

--This script drops all tables created by createTables.sql, if they exist, with CASCADE

START TRANSACTION;

DROP TABLE IF EXISTS Course CASCADE;

DROP TABLE IF EXISTS Season CASCADE;

DROP TABLE IF EXISTS Term CASCADE;

DROP TABLE IF EXISTS Instructor CASCADE;

DROP TABLE IF EXISTS Section CASCADE;

DROP TABLE IF EXISTS Grade CASCADE;

DROP TABLE IF EXISTS GradeTier CASCADE;

DROP TABLE IF EXISTS Student CASCADE;

DROP TABLE IF EXISTS Enrollee CASCADE;

DROP TABLE IF EXISTS AttendanceStatus CASCADE;

DROP TABLE IF EXISTS AttendanceRecord CASCADE;

DROP TABLE IF EXISTS AssessmentComponent CASCADE;

DROP TABLE IF EXISTS AssessmentItem CASCADE;

DROP TABLE IF EXISTS Submission CASCADE;

COMMIT;
