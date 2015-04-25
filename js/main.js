(function ($, Firebase, marked, md) {

    'use strict';

    var DISABLING_PREFIX = '__',
        ALLOW_MARKDOWN = true,
        FIRE = new Firebase('https://translation-demo.firebaseio.com/'),
        $article = $('article'),
        $alert = $('#alerts'),
        locale = window.location.search.replace('?', '') || '',
        notifications = {
        	genericError: '<strong>Something went wrong.</strong> Check console log for more info. Check concole log for more info',
        	loginFailure: '<strong>Login Failed!</strong> ',
        	newLocaleCreated: '<strong>New locale added.</strong> You are the first person to edit this document.',
        	invalidJson: '<strong>Not valid JSON.</strong> The file contains invalid JSON code.',
        	incorrectFileType: '<strong>Wrong file type.</strong> The master file needs to be a valide JSON file.',
        	fetchingData: '<strong>Fetching your data…</strong> The files are being fetched from Firebase. This may take a few seconds.',
        	saveFail: '<strong>Not saved!</strong> ',
        	saveSuccess: '<strong>Done.</strong> Data saved successfully.',
        	saveProgress: '<strong>Saving…</strong>'
        };

    // http://stackoverflow.com/questions/19098797/fastest-way-to-flatten-un-flatten-nested-json-objects
    JSON.flatten = function (data, isMaster) {
        var result = {};

        function recurse(cur, prop) {
            var depth = 0;
            if (Object(cur) !== cur) {
                result[prop] = cur;
            } else if (Array.isArray(cur)) {
                for (var i = 0, l = cur.length; i < l; i++)
                    recurse(cur[i], prop + "[" + i + "]");
                if (l == 0)
                    result[prop] = [];
            } else {
                var isEmpty = true;
                for (var p in cur) {
                    isEmpty = false;
                    // add titles to sections
                    addTitles(result, prop, depth, isMaster);
                    recurse(cur[p], prop ? prop + "." + p : p);
                }
                if (isEmpty && prop)
                    result[prop] = {};
            }
        }
        recurse(data, "");
        return result;
    };

    JSON.unflatten = function (data) {
        if (Object(data) !== data || Array.isArray(data))
            return data;
        var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
            resultholder = {};
        for (var p in data) {
            var cur = resultholder,
                prop = "",
                m;
            while (m = regex.exec(p)) {
                cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
                prop = m[2] || m[1];
            }
            cur[prop] = data[p];
        }
        console.log(resultholder[""] || resultholder);
        return resultholder[""] || resultholder;
    };

    function Localiser ($container, $alert, fireBase, locale) {

        this.$container = $container;
        this.$alert = $alert;
        this.fireBase = fireBase;
        this.locale = locale;
        this.htmlPattern = /<[a-z][\s\S]*>/i;
        this.titleTpl = $("#title-template").html();
        this.entryTpl = $("#entry-template").html();
        this.alertTimer = null;

        // set events
        this.$container.on('focus', '.value', this.storeCurrent.bind(this));
        this.$container.on('blur', '.value', this.checkEdit.bind(this));

        if (this.fireBase.getAuth()) {
            this.isLoggedIn();
        } else {
            this.$container.find('form').on('submit', this.authenticate.bind(this));
        }
    }

    Localiser.prototype.showAlert = function (message, type) {
        this.$alert.attr('class', 'alert alert-'+type).html(message).show();

        clearTimeout(this.alertTimer);
        this.alertTimer = setTimeout(this.hideAlert.bind(this), 7000);
    };

    Localiser.prototype.hideAlert = function () {
        this.$alert.hide();
    };

    Localiser.prototype.authenticate = function (ev) {
        ev.preventDefault();

        var formData = $(ev.currentTarget).serializeArray();

        this.fireBase.authWithPassword({
            email: formData[0].value,
            password: formData[1].value
        }, function (error) {
            if (error) {
                this.showAlert(notifications.loginFailure + error.message, 'danger');
                console.log('Login Failed!', error);
            } else {
                this.isLoggedIn();
            }
        }.bind(this));
    };

    Localiser.prototype.isLoggedIn = function () {
        this.$container.find('#login').hide();
		this.showAlert(notifications.fetchingData, 'info');
        // get data from firebase
        this.fireBase.on('value', this.render.bind(this));
    };

    Localiser.prototype.importMaster = function () {
    	var $wrap = $('#import');
		$wrap.addClass('show').find('input').on('change', this.handleFileSelect.bind(this));
    };

    Localiser.prototype.handleFileSelect = function (ev) {
		var file = ev.target.files[0]; // FileList object

		if (file.type !== 'application/json') {
			this.showAlert(notifications.incorrectFileType, 'danger');
			return;
		}

		var reader = new FileReader();

		reader.onloadend = this.processUploadedFile.bind(this);
		reader.readAsBinaryString(file);
    };

    Localiser.prototype.processUploadedFile = function (ev) {
		// If we use onloadend, we need to check the readyState.
    	if (ev.target.readyState == FileReader.DONE) { // DONE == 2
    		try {
    			$('#import').removeClass('show');
    			this.fireBase.child('master').set(JSON.parse(ev.target.result));
    		} catch(err) {
    			this.showAlert(notifications.invalidJson, 'danger');
    			console.log(err);
    		}

    	} else {
    		this.showAlert(notifications.genericError, 'danger');
    		console.log(ev);
    	}
    },

    Localiser.prototype.addNewLocale = function (locale) {
		this.showAlert(notifications.newLocaleCreated, 'info');
		this.fireBase.child(locale).set(1);
		this.render();
    },

    Localiser.prototype.render = function (data) {
        var rendered = '';

        this.json = data && data.exportVal() || this.json;

        if (!this.json.master) {
        	this.importMaster();
        	return;
        }

        Mustache.parse(this.titleTpl);
        Mustache.parse(this.entryTpl);

        if (!this.locale) {
            $('#locale-warning').addClass('show');
            return;

        } else if (!this.json[this.locale]) {
            this.addNewLocale(this.locale);
        	return;
        }

        if (ALLOW_MARKDOWN) {
            this.$container.find('#md-notice').show();
        }

        this.flatMaster = JSON.flatten(this.json.master, true); // isMaster = true
        this.flatSlave = JSON.flatten(this.json[this.locale]);

        $.each(this.flatMaster, function(key, val) {

            if (key.indexOf('$display_title') > -1) {
                rendered += Mustache.render(this.titleTpl, {
                    title: val.replace(/_/g, ' '),
                    heading: Math.min(6, key.split('_').pop())
                });

            } else {
                rendered += Mustache.render(this.entryTpl, {
                    key: key,
                    master: val,
                    slave: this.htmlToMarkdown(this.flatSlave[key]),
                    hasPreview: ALLOW_MARKDOWN,
                    disabled: key.split('.').pop().indexOf(DISABLING_PREFIX) === 0
                });
            }
        }.bind(this));

        this.hideAlert();
        this.$container.find('#content').html(rendered);

        $('textarea').elastic();
        $('.doc-buttons').show();
    };

    Localiser.prototype.htmlToMarkdown = function (txt) {
        return ALLOW_MARKDOWN && this.htmlPattern.test(txt) ? md(txt) : txt;
    };

    Localiser.prototype.storeCurrent = function (ev) {
        ev.stopPropagation();
        this.currentValue = ev.currentTarget.value.trim();
    };

    Localiser.prototype.checkEdit = function (ev) {
        var newValue = ev.currentTarget.value.trim();

        if (this.currentValue !== newValue) {
            $(ev.currentTarget).addClass('modified');

            this.previewChanges(ev.currentTarget);
        }
    };

    Localiser.prototype.previewChanges = function (el) {
        var html = marked(el.value);

        if (!ALLOW_MARKDOWN) { return; }

        if (!el.$preview) {
            el.$preview = $('<div class="preview col-xs-4"/>').insertAfter(el);
        }

        // if el has only one p tag remove it.
        if (html.split('<p>').length - 1 === 1) {
            html = html.replace(/(\<p\>|\<\/p\>)/gi, '').replace(/(\r\n|\n|\r)/gm, '');
        }

        el.$preview.html(html);
    };

    Localiser.prototype.save = function () {
        var isModified;

        $(':focus').blur();

        this.$container.find('.modified').each(function (key, el) {
            var node = el.title,
                newValue = ALLOW_MARKDOWN ? el.$preview.html() : el.value;

            this.flatSlave[node] = newValue;
            isModified = 1;
        }.bind(this)).removeClass('modified');

        if (!isModified) return;

        this.showAlert(notifications.saveProgress, 'info');
        this.json[locale] = JSON.unflatten(this.flatSlave);
        this.fireBase.update(this.json, this.onSaveComplete.bind(this));
    };

    Localiser.prototype.onSaveComplete = function (error) {
        if (error) {
            this.showAlert(notifications.saveFail + error, 'danger');
        } else {
            this.showAlert(notifications.saveSuccess, 'success');
        }
    };




    var addTitles = function (result, prop, depth, isMaster) {
            if (!isMaster) { return; }
            depth++;
            if (depth === 1 && prop) {
                var title = prop + '.$display_title_'+prop.split('.').length;
                result[title] = prop.split('.').pop();
            }
        },

        reset = function () {
            location.reload();
        };

    // initialise markdown preview renderer
    marked.setOptions({
        renderer: new marked.Renderer(),
        gfm: false,
        breaks: true,
        sanitize: true,
        smartLists: true,
        smartypants: true
    });

    var translationApp = new Localiser($article, $alert, FIRE, locale);

    $('#reset').on('click', reset);
    $('#save').on('click', translationApp.save.bind(translationApp));


})(jQuery, Firebase, marked, md);