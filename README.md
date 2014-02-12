# Translation Utility (this project is very much in Alpha state)

This utility is meant to make the localization of web apps easier by providing a easy to use interfface for editing JSON localization files.

[demo](http://jdwillemse.github.io/translation-utility)

A translation file can be edited directly by uploading it as a master file or a

## Features

* A masterfile with the JSON fields that need translation can be used as a template for translation.
* Fields that are present in the master file but not in the locale will be added.
* Fields that are present in the locale file but not in the master will be removed.
* Locale file can be edited directly by uploading them as the master file.
* Locale files are save with the locale code and the date as the file name.
* Underscores in keys are converted to spaces.
* Html in the value fields is rendered as markdown.
* After editing a value a preview is shown.


## TODO: add way to select files

* add error handling to php for upload and save

This app was created for internal use so has not been x-browser tested.