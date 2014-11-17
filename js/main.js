(function ($, Firebase, marked, md) {

    'use strict';

    var DISABLING_PREFIX = '__',
        ALLOW_MARKDOWN = true,
        FIRE = new Firebase('https://translation-demo.firebaseio.com/'),
        $article = $('article'),
        $alert = $('#alerts'),
        locale = window.location.search.replace('?', '') || '';

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

    Localiser.prototype.hideAlert = function (message, type) {
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
                this.showAlert('<strong>Login Failed!</strong> ' + error.message);
                console.log('Login Failed!', error);
            } else {
                this.isLoggedIn();
            }
        }.bind(this));
    };

    Localiser.prototype.isLoggedIn = function () {
        this.$container.find('#login').hide();
        // get data from firebase
        this.fireBase.once('value', this.render.bind(this));

    };

    Localiser.prototype.render = function (data) {
        var rendered = '';

        this.json = data.exportVal();

        Mustache.parse(this.titleTpl);
        Mustache.parse(this.entryTpl);

        if (!this.json[this.locale]) {
            this.showAlert('<strong>File not found.</strong> Make sure the url is correct', 'danger');
            return;

        } else if (ALLOW_MARKDOWN) {
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

        this.showAlert('<strong>Saving…</strong>', 'info');
        this.json[locale] = JSON.unflatten(this.flatSlave);
        this.fireBase.update(this.json, this.onSaveComplete.bind(this));
    };

    Localiser.prototype.onSaveComplete = function (error) {
        if (error) {
            this.showAlert('<strong>Not be saved!</strong> ' + error, 'danger');
        } else {
            this.showAlert('<strong>Done.</strong> Data saved successfully.', 'success');
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