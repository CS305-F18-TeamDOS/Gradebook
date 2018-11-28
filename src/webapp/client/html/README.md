# README.md
<!--This is the README document for the pre-login part of the User Interface. This document will explain all of the pages that are implemented in this part of the program and will explain the functionality used in the program. -->
Kyle Bella, Kenneth Kozlowski and Joseph Tether  
CS305-71  
Team DOS
***  

Date of Last Revision: *November 5, 2018*  
Modified by: *Kenneth Kozlowski*

<!--This document was created using MacDown, a free program for writing markdown files on MAC OSX-->

***

### General Information  

Most of the CSS Styling in this part of the program is from https://materializecss.com/   
  
All of the pages present before a login attempt is completed will show the user a screen with `Gradebook - Sample Institution` at the top left corner of the page. The user will then see navigation at the top right hand of the page where there are three tabs shown `Login`, `About` and `Change Log`.  

The navigation tabs will load the page that corresponds to the Tabs title.  

Clicking on the `Login` tab will bring the user to `login.html`  
Clicking on the `About` tab will bring the user to `about.html`  
Clicking on the `Change Log` tab will bring the user to `changeLog.html`

*NOTE*: `Sample Institution` can be changed in all of the files to reflect the name of the institution that is using the product.  
To change the name of the institution, all of the HTML files would need to be opened in a text editor and the line: `      			<a href="#" class="brand-logo"> Gradebook - Sample Institution</a>
` can be changed to say `Gradebook - Institution Name`.

***

### Login.html  
The user will be prompted by the program to enter in their login credentials.  
The login credentials that will be accepted by the program will be a valid email address and a password. After that the program will determine if the username of the email address is a valid database user and if they are the password will be authenticated so the user could login or not.

***
### About.html  
This page contains all of the About information that was included in the DASSL Implementation of Gradebook.  
There is only one line that was added on this page and that line was to mention the names of all of the members of Team DOS to give them credit for the modifications that were made to the program for the DOS Implementation of Gradebook.

***
### ChangeLog.html  
This page will show a list of all of the changes made to Gradebook from the DASSL Implementation of the program to the DOS implementation of the program.  
As of now, the list is just maintained as one large numbered list.
<!--Now refers to Current Date of 10/31/2018-->

<!-- This will probably need to be changed in the future because the list will probably be reorganized with different categories for all of the changes to fall under.-->


