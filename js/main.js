(function ($, Firebase, marked, md) {

    'use strict';

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
        return resultholder[""] || resultholder;
    };


    var ALLOW_MD = true,
        masterfile = 'locales/master.json',
        $article = $('article'),
        $alert = $('#alerts'),
        $login = $article.find('#login'),
        htmlPattern = /<[a-z][\s\S]*>/i,
        locale = window.location.search.replace('?', '') || '',
        fire = new Firebase('https://incandescent-fire-540.firebaseio.com/'),
        authData = fire.getAuth(),
        titleTpl = $("#title-template").html(),
        entryTpl = $("#entry-template").html(),
        flatMaster,
        flatSlave,
        json,
        currentValue,
        alertTimer,

        addTitles = function (result, prop, depth, isMaster) {
            if (!isMaster) { return; }
            depth++;
            if (depth === 1 && prop) {
                var title = prop + '.$display_title_'+prop.split('.').length;
                result[title] = prop.split('.').pop();
            }
        },

        showAlert = function (message, className) {
            $alert.attr('class', 'alert alert-'+className).html(message).show();
            clearTimeout(alertTimer);
            alertTimer = setTimeout(function() {
                $alert.hide();
            }, 7000);
        },

        htmlToMarkdown = function (txt) {
            return ALLOW_MD && htmlPattern.test(txt) ? md(txt) : txt;
        },

        storeCurrent = function (ev) {
            ev.stopPropagation();
            currentValue = ev.currentTarget.value.trim();
        },

        previewChanges = function (el) {
            var html = marked(el.value);

            if (!ALLOW_MD) { return; }

            if (!el.$preview) {
                el.$preview = $('<div class="preview col-xs-4"/>').insertAfter(el);
            }

            // if el has only one p tag remove it.
            if (html.split('<p>').length - 1 === 1) {
                html = html.replace(/(\<p\>|\<\/p\>)/gi, '').replace(/(\r\n|\n|\r)/gm, '');
            }

            el.$preview.html(html);
        },

        checkEdit = function (ev) {
            ev.currentTarget.value = ev.currentTarget.value.trim();

            if (currentValue !== ev.currentTarget.value) {
                $(ev.currentTarget).addClass('modified').data('original', currentValue);

                previewChanges(ev.currentTarget);
            }
        },

        mergeObj = function (a, b) {
            for (var key in b) {
                if (key in a) {
                    a[key] = typeof a[key] === 'object' &&
                        typeof b[key] === 'object' ? mergeObj(a[key], b[key]) : b[key];
                }
            }
            return a;
        },

        reset = function () {
            location.reload();
        },

        onSaveFeedback = function (error) {
            if (error) {
                showAlert('<strong>Not be saved!</strong> ' + error, 'danger');
            } else {
                showAlert('<strong>Done.</strong> Data saved successfully.', 'success');
            }
        },

        save = function () {
            var saveObj = {
                    filename: json.code || 'locale',
                    json: json
                },
                isModified;

            $(':focus').blur();

            $article.find('.modified').each(function (key, el) {
                var node = el.title,
                    newValue = ALLOW_MD ? el.$preview.html() : el.value;

                flatSlave[node] = newValue;
                isModified = 1;
            }).removeClass('modified');

            if (!isModified) return;

            showAlert('<strong>Saving…</strong>', 'info');
            json[locale] = JSON.unflatten(flatSlave);
            fire.update(json, onSaveFeedback);
        },

        addTranslation = function ($el, key) {
            var copy = eval('json.' + locale + key.replace('root', '')),
                $translation = $('<textarea/>').addClass('col-xs-4 value').attr('title', key).html(copy);

            $el.after($translation);
        },

        render = function (data) {
            var rendered = '';

            json = data.exportVal();

            if (!json[locale]) {
                showAlert('<strong>File not found.</strong> Make sure the url is correct', 'danger');
                return;

            } else if (ALLOW_MD) {
                $article.find('#md-notice').show();
            }

            flatMaster = JSON.flatten(json.master, true); // isMaster = true
            flatSlave = JSON.flatten(json[locale]);

            console.log(flatMaster);

            $.each(flatMaster, function(key, val) {

                if (key.indexOf('$display_title') > -1) {
                    rendered += Mustache.render(titleTpl, {
                        title: val.replace(/_/g, ' '),
                        heading: Math.min(6, key.split('_').pop())
                    });

                } else {
                    rendered += Mustache.render(entryTpl, {
                        key: key,
                        master: val,
                        slave: htmlToMarkdown(flatSlave[key]),
                        hasPreview: ALLOW_MD,
                        disabled: key.split('.').pop().indexOf('__') === 0
                    });
                }
            });

            $article.find('#content').html(rendered);

            $('textarea').elastic();
            $('.doc-buttons').show();
        },

        isLoggedIn = function (ev) {
            $login.hide();
            // get data from firebase
            fire.once('value', render);
        },

        authenticate = function (ev) {
            ev.preventDefault();

            var formData = $(this).serializeArray();

            fire.authWithPassword({
                email: formData[0].value,
                password: formData[1].value
            }, function (error, authData) {
                if (error) {
                    alert('ERROR: ' + error.message);
                    console.log('Login Failed!', error);
                } else {
                    isLoggedIn();
                }
            });

        };

    Mustache.parse(titleTpl);
    Mustache.parse(entryTpl);

    // initialise markdown preview renderer
    marked.setOptions({
        renderer: new marked.Renderer(),
        gfm: false,
        breaks: true,
        sanitize: true,
        smartLists: true,
        smartypants: true
    });

    // set events
    $article.on('focus', '.value', storeCurrent);
    $article.on('blur', '.value', checkEdit);

    $('#reset').on('click', reset);
    $('#save').on('click', save);

    if (authData) {
        isLoggedIn();
    } else {
        $('form').on('submit', authenticate);
    }

})(jQuery, Firebase, marked, md);