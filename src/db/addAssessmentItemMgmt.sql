--createFunctions.sql - GradeBook

--Team DOS: Kyle Bella, Kenneth Kozlowski, Joe Tether
--Created for CS305-71
--Date of Revision: 10/31/2018

--this script creates the functions used by Team DOS's Gradebook implementation

--check that due date is not before class start date
--check that due date is not after class end date
--used in check constraint for AssessmentComponent table
--takes due date and component id as parameters
CREATE OR REPLACE FUNCTION DueDateValidityCheck
(DueDate DATE, ComponentID INT) RETURNS BOOLEAN AS
$$
DECLARE
  SectionEndDate DATE;
  SectionStartDate DATE;
BEGIN
  SectionEndDate = (SELECT EndDate FROM Section
                    WHERE Section.ID = --getting start date from section related to assessment
                      (SELECT Section FROM AssessmentComponent
                        WHERE AssessmentComponent.ID = ComponentID))::date;

  SectionStartDate = (SELECT StartDate FROM Section
                    WHERE Section.ID = --getting end date from section related to assessment
                     (SELECT Section FROM AssessmentComponent
                       WHERE AssessmentComponent.ID = ComponentID))::date;

  IF SectionStartDate <= DueDate AND DueDate <= SectionEndDate THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;
