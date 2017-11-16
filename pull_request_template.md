# Description

Please include a summary of the change and which issue is fixed. Please also include relevant motivation and context. List any dependencies that are required for this change. Explain both the expected functionality and the edge cases. 

## Type of change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix a feature that knowingly causes existing functionality to not work as expected)

# Test and Reproduce
Outline the steps to test or reproduce the PR here.

1. 

## Impacted Areas in Application
List general components of the application that this PR will affect:

Which pages?

- [ ] Login Screen
- [ ] Single Upload Page
- [ ] Batch Upload Page
- [ ] All Projects Page
- [ ] Sample Details Page
- [ ] Report Page

Specific components 

* 

# Testing Script:

###Login Page
* Successfully login to the application and get taken to the project page

###Single Upload
* Using an AWS path that doesn't exist throws an error
* Succesfully uploaded files from a folder (use test host)
* Uploading a duplicate file throws an error
* Pipeline gets initiated successfully 

###Batch Upload
* Using an AWS path that doesn't exist throws an error
* Succesfully uploaded files from a folder (use test host)
* Navigate to batch upload settings page after upload 
* Host selection from previous page still selected 
* Uploading a duplicate file throws a warning
* Pipeline gets initiated successfully 

###All Project Page
* Switch between projects 
* Search for a sample
* Navigate through different pages of samples
* Select Upload new sample button
* Select sample to see generated report

###Sample Details Page
* Information is consistent from Project Page
* Notes are editable and save successfully 
* Can navigate to report page 

###Report Page
* Data loads succesfully 
* Collapse and Uncollapse button works
* Clicking on the taxonomy name gives you total reads for that taxon
* Category filter works
* Genus Search works
* Filters work as expected
* Disabling Filters works
* Filtering by column works 

# Checklist:

- [ ] I have run through the testing script to make sure current functionality is unchanged
- [ ] I have done relevant tests that prove my fix is effective or that my feature works
- [ ] I have spent time testing out edge cases for my feature
- [ ] I have updated the test script or pull request template if necessary
- [ ] New and existing unit tests pass locally with my changes

