# Translation Utility (this project is very much in Beta)

This utility is meant to make the localization of web apps easier by providing a easy-to-use interface for editing JSON localisation files. Firebase is used to store the files in the cloud and cant either be served from there or downloaded using Grunt.

[demo](http://jdwillemse.github.io/translation-utility)

## Installation
1. Create a Firebase database
2. Create a object named 'master' in your database
3. Import your structured JSON file that will serve ass the translation master to this object
4. Create object which will hold translation. This object can be prefilled with an import if it exists
5. Create a user in Firebase, because login is required to edit files
6. In the url the object to translate is specified as a query: ?nl_nl

## Export
To export data from Firebase create a file auth.json in the config folder with you Firebase secret token {"token": "TOKEN_VALUE"}. In Gruntfile you specify the translation to export and then run the default grunt task. This will export your file to the locales folder.

## Features

* A masterfile with the JSON fields that need translation can be used as a template for translation.
* Fields that are present in the master file but not in the locale will be added when data a translation is added.
* Fields that are present in the locale file but not in the master will not be removed so translated text is not lost when master changes.
* Prefixing a key with two underscores renderes it uneditable.
* Underscores in keys are converted to spaces.
* Markdown can optionally be used to style text.
* Html in the value fields is rendered as markdown.
* After editing a value a preview is shown if markdown is used.


## TODO
* add offline support
* provide way to add comments

This app was created for internal use so has not been x-browser tested.



*Favicon designed by [Berkay Sargın](http://www.thenounproject.com/berkaey) from the [Noun Project](http://www.thenounproject.com)*