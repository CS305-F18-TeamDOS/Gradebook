--createTables.sql - GradeBook

--Zaid Bhujwala, Zach Boylan, Steven Rollo, Sean Murthy
--Data Science & Systems Lab (DASSL)
--Western Connecticut State University (WCSU)

--Edited by Team DOS: Kyle Bella, Kenneth Kozlowski, Joe Tether
--Edited for CS305-71
--Date of Revision: 10/31/2018

--(C) 2017- DASSL. ALL RIGHTS RESERVED.
--Licensed to others under CC 4.0 BY-SA-NC
--https://creativecommons.org/licenses/by-nc-sa/4.0/

--PROVIDED AS IS. NO WARRANTIES EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

--This script creates schema, tables, and indexes
--for the Gradebook application

--E-mail address management is based on the discussion presented at:
-- https://gist.github.com/smurthys/feba310d8cc89c4e05bdb797ca0c6cac

--This script should be run after running the script initializeDB.sql
-- in the normal course of operations, this script should not be run
-- individually, but instead should be called from the script prepareDB.sql

--This script assumes a schema named "Gradebook" already exists and is empty

--Spool results to a file in the current directory
--\o spoolCreateTables.txt

--Echo time, date and user/server/DB info
--\qecho -n 'Script run on '
--\qecho -n `date /t`
--\qecho -n 'at '
--\qecho `time /t`
--\qecho -n 'Script run by ' :USER ' on server ' :HOST ' with db ' :DBNAME
--\qecho ' '


CREATE TABLE Course
(
   --Wonder if this table will eventually need a separate ID field
   Number VARCHAR(8) NOT NULL PRIMARY KEY, --e.g., 'CS170'
   Title VARCHAR(100) NOT NULL --e.g., 'C++ Programming'
);


CREATE TABLE Season
(
   --Order denotes the sequence of seasons within a year: 0, 1,...9
    Season_Order NUMERIC(1,0) PRIMARY KEY CHECK (Season_Order >= 0),

   --Name is a description such as Spring and Summer: must be 2 or more chars
   -- uniqueness is enforced using a case-insensitive index
   Name VARCHAR(20) NOT NULL CHECK(LENGTH(TRIM(Name)) > 1),

   --Code is 'S', 'M', etc.: makes it easier for user to specify a season
   -- permit only A-Z (upper case)
   Code CHAR(1) NOT NULL UNIQUE CHECK(Code ~ '[A-Z]')
);

--enforce case-insensitive uniqueness of season name
CREATE UNIQUE INDEX idx_Unique_SeasonName ON Season(LOWER(TRIM(Name)));

CREATE TABLE Term
(
   ID SERIAL NOT NULL PRIMARY KEY,
   Year NUMERIC(4,0) NOT NULL CHECK (Year > 0), --'2017'
   Season NUMERIC(1,0) NOT NULL REFERENCES Season,
   StartDate DATE NOT NULL, --date the term begins
   EndDate DATE NOT NULL, --date the term ends (last day of  "finals" week)
   UNIQUE(Year, Season)
);


CREATE TABLE Instructor
(
   ID SERIAL PRIMARY KEY,
   FName VARCHAR(50) NOT NULL,
   MName VARCHAR(50),
   LName VARCHAR(50) NOT NULL,
   Department VARCHAR(30),
   Email VARCHAR(319) CHECK(TRIM(Email) LIKE '_%@_%._%'),
   UNIQUE(FName, MName, LName)
);

--enforce case-insensitive uniqueness of instructor e-mail addresses
CREATE UNIQUE INDEX idx_Unique_InstructorEmail
ON Instructor(LOWER(TRIM(Email)));

--Create a partial index on the instructor names.  This enforces the CONSTRAINT
-- that only one of any (FName, NULL, LName) is unique
CREATE UNIQUE INDEX idx_Unique_Names_NULL
ON Instructor(FName, LName)
WHERE MName IS NULL;

CREATE TABLE Section
(
   ID SERIAL PRIMARY KEY,
   Term INT NOT NULL REFERENCES Term,
   Course VARCHAR(8) NOT NULL REFERENCES Course,
   SectionNumber VARCHAR(3) NOT NULL, --'01', '72', etc.
   CRN VARCHAR(5) NOT NULL, --store this info for the registrar's benefit?
   Schedule VARCHAR(7),  --days the class meets: 'MW', 'TR', 'MWF', etc.
   Location VARCHAR(25), --likely a classroom
   StartDate DATE, --first date the section meets
   EndDate DATE, --last date the section meets
   MidtermDate DATE, --date of the "middle" of term: used to compute mid-term grade
   Instructor1 INT NOT NULL REFERENCES Instructor, --primary instructor
   Instructor2 INT REFERENCES Instructor, --optional 2nd instructor
   Instructor3 INT REFERENCES Instructor, --optional 3rd instructor
   UNIQUE(Term, Course, SectionNumber),

   --make sure instructors are distinct
   CONSTRAINT DistinctSectionInstructors
        CHECK (Instructor1 <> Instructor2
               AND Instructor1 <> Instructor3
               AND Instructor2 <> Instructor3
              )
);

--Table to store all possible letter grades
--A -> F, standard letter grades
--some universities permit A+
--SA: Stopped attending, W: Withdrawn, TR: Transfer,
--E: Exlcuded from GPA calculation, AU: Audit
CREATE TABLE Grade
(
   Letter VARCHAR(2) NOT NULL PRIMARY KEY,
   GPA NUMERIC(4,3),

   --Restrict Letter to a list of valid choices
   CONSTRAINT LetterChoices
      CHECK (Letter IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+',
                        'C', 'C-', 'D+', 'D', 'D-', 'F', 'SA',
                        'W', 'TR', 'E', 'AU')
            ),

   --GPA must be of a standard choice, or NULL
   CONSTRAINT GPAChoices
      CHECK (GPA IN (4.333, 4, 3.667, 3.333, 3, 2.667, 2.333, 2, 1.667,
                    1.333, 1, 0.667, 0)
              OR GPA IS NULL),

   --Standard letter grades may not have NULL GPA's
   --Non-standard letter grades may not have GPA's
   CONSTRAINT LetterChoiceNULLControl
              CHECK((Letter IN('SA', 'W', 'TR', 'E', 'AU')
                            AND GPA IS NULL)
                      OR
                            (Letter IN('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+',
                                       'C', 'C-', 'D+', 'D', 'D-', 'F')
                             AND GPA IS NOT NULL))
);


--Table to store mapping of percentage score to a letter grade: varies by section
CREATE TABLE GradeTier
(
   Section INT REFERENCES Section(ID),
   LetterGrade VARCHAR(2) NOT NULL REFERENCES Grade(Letter),
   LowPercentage NUMERIC(4,2) NOT NULL CHECK (LowPercentage >= 0) UNIQUE,
   HighPercentage NUMERIC(5,2) NOT NULL CHECK (HighPercentage > 0) UNIQUE,
   PRIMARY KEY(Section, LetterGrade)
);


CREATE TABLE Student
(
   ID SERIAL PRIMARY KEY,
   FName VARCHAR(50), --at least one of the name fields must be used: see below
   MName VARCHAR(50), --permit NULL in all 3 fields because some people have only one name: not sure which field will be used
   LName VARCHAR(50), --use a CONSTRAINT on names instead of NOT NULL until we understand the data
   SchoolIssuedID VARCHAR(50) NOT NULL UNIQUE,
   Email VARCHAR(319) CHECK(TRIM(Email) LIKE '_%@_%._%'),
   Major VARCHAR(50), --non-matriculated students are not required to have a major
   Year VARCHAR(30), --represents the student year. Ex: Freshman, Sophomore, Junior, Senior
   CONSTRAINT StudentNameRequired --ensure at least one of the name fields is used
      CHECK (FName IS NOT NULL OR MName IS NOT NULL OR LName IS NOT NULL)
);

--enforce case-insensitive uniqueness of student e-mail addresses
CREATE UNIQUE INDEX idx_Unique_StudentEmail
ON Student(LOWER(TRIM(Email)));


CREATE TABLE Enrollee
(
   Student INT NOT NULL REFERENCES Student,
   Section INT REFERENCES Section,
   DateEnrolled DATE NULL, --used to figure out which assessment components to include/exclude
   YearEnrolled VARCHAR(30) NOT NULL,
   MajorEnrolled VARCHAR(50) NOT NULL,
   MidtermWeightedAggregate NUMERIC(5,2), --weighted aggregate computed at mid-term
   MidtermGradeComputed VARCHAR(2), --will eventually move to a view
   MidtermGradeAwarded VARCHAR(2), --actual grade assigned, if any
   FinalWeightedAggregate NUMERIC(5,2), --weighted aggregate computed at end
   FinalGradeComputed VARCHAR(2),  --will eventually move to a view
   FinalGradeAwarded VARCHAR(2), --actual grade assigned
   PRIMARY KEY (Student, Section),
   FOREIGN KEY (Section, MidtermGradeAwarded) REFERENCES GradeTier,
   FOREIGN KEY (Section, FinalGradeAwarded) REFERENCES GradeTier
);


CREATE TABLE AttendanceStatus
(
   Status CHAR(1) NOT NULL PRIMARY KEY, --'P', 'A', ...
   Description VARCHAR(20) NOT NULL UNIQUE --'Present', 'Absent', ...
);


CREATE TABLE AttendanceRecord
(
   Student INT NOT NULL,
   Section INT NOT NULL,
   Date DATE NOT NULL,
   Status CHAR(1) NOT NULL REFERENCES AttendanceStatus,
   PRIMARY KEY (Student, Section, Date),
   FOREIGN KEY (Student, Section) REFERENCES Enrollee
);


CREATE TABLE AssessmentComponent
(
   ID INT NOT NULL PRIMARY KEY,
   Section INT NOT NULL REFERENCES Section(ID),
   Type VARCHAR NOT NULL, --"Assignment", "Quiz", "Exam",...
   Weight NUMERIC(5,2) NOT NULL
        --allowing weight 0 allows graded assignments with no weight
        --e.g. graded feedback on practice
        --weight can also not be > 100
        CHECK ((Weight >= 0) AND (Weight <= 100)),
   Description VARCHAR NULL,
   NumItems INT NOT NULL DEFAULT 1
);

--Table mapping assessment items to parent component items
CREATE TABLE AssessmentItem
(
  Component INT NOT NULL REFERENCES AssessmentComponent(ID),
  SequenceInComponent INT NOT NULL NOT NULL CHECK (SequenceInComponent > 0),
  BasePoints NUMERIC(10,2) NOT NULL CHECK (BasePoints > 0), --Item cannot be worth 0 points
  ExtraCreditPoints NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (ExtraCreditPoints >= 0),
  AssignedDate Date,
  DueDate Date CHECK (DueDate >= AssignedDate), --item can not be due before it's assigned
  Curve NUMERIC(5,2) NULL CHECK(Curve > 0),

  CONSTRAINT DateVailidty --confirm that section startdate <= item duedate <= section enddate
          CHECK(DueDateValidityCheck(DueDate, Component)),

  PRIMARY KEY(Component, SequenceInComponent)
);

--table mapping enrollee submissions of asssessment items
CREATE TABLE Submission
(
   Student INT NOT NULL,
   Section INT NOT NULL,
   Component INT NOT NULL,
   SequenceInComponent INT NOT NULL,
   BasePointsEarned NUMERIC(5,2) CHECK (BasePointsEarned >= 0), --points earned cannot be negative
   ExtraCreditPointsEarned NUMERIC(5,2) CHECK (ExtraCreditPointsEarned >= 0), --extra credit cannot be negative
   SubmissionDate DATE,
   Penalty NUMERIC(5,2) CHECK (Penalty >= 0), --penalty cannot be negative
   InstructorNote VARCHAR,
   PRIMARY KEY(Student, Section, Component, SequenceInComponent),
   FOREIGN KEY (Student, Section) REFERENCES Enrollee,
   FOREIGN KEY (Component, SequenceInComponent) REFERENCES AssessmentItem
);


--turn spooling off
--\o
