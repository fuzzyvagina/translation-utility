(function ($, Firebase, marked, md) {

    'use strict';

    var masterfile = 'locales/master.json',
        $article = $('article'),
        $alert = $('.alert'),
        htmlPattern = /<[a-z][\s\S]*>/i,
        json,
        currentValue,
        locale = window.location.search.replace('?', '') || '',
        fire = new Firebase('https://incandescent-fire-540.firebaseio.com/'),
        authData = fire.getAuth(),

        stylise = function (el) {
            $(el).attr('class', 'col-xs-4 master')
                .prev().attr('class', 'key')
                .parent().attr('class', 'row');
        },

        htmlToMarkdown = function ($el, key) {
            var txt = $el.html(),
                markedDown;

            if (!htmlPattern.test(txt)) { return; }

            markedDown = md(txt);
            $article.find('[title=\'' + key + '\']').val(markedDown);
        },

        storeCurrent = function (ev) {
            ev.stopPropagation();
            currentValue = ev.currentTarget.value.trim();
        },

        previewChanges = function (el) {
            var html = marked(el.value);

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

        // update value in json object to match what changed in editor
        changeJsonValue = function (obj, strProp, newValue) {
            var re = /\["?([^"\]]+)"?\]/g,
                m, p;

            while ((m = re.exec(strProp)) && typeof obj[p = m[1]] === 'object')
                obj = obj[p];

            if (p)
                obj[p] = newValue;
        },

        onSaveFeedback = function (error) {
            if (error) {
                alert("Data could not be saved. " + error);
            } else {
                console.log("Data saved successfully.");
            }
        },

        save = function () {
            var saveObj = {
                    filename: json.code || 'locale',
                    json: json
                },
                isModified;

            $(':focus').blur();

            $('.modified').each(function (key, el) {
                var node = el.title,
                    newValue = el.$preview.html();

                changeJsonValue(json, node, newValue);
                isModified = 1;
            }).removeClass('modified');

            if (!isModified) return;

            fire.set(json, onSaveFeedback);
        },

        addTranslation = function ($el, key) {
            var copy = eval('json.' + locale + key.replace('root', '')),
                $translation = $('<textarea/>').addClass('col-xs-4 value').attr('title', key).html(copy);

            $el.after($translation);
        },

        render = function (data) {
            json = data.exportVal();

            if (!json) {
                $article.html('<h3>Locale not found</h3><p>Make sure the url is correct</p>');
                return;
            }

            $article.empty().renderJSON(json.master);

            $('.renderjson-scalar', $article).each(function (i, el) {
                var $el = $(el),
                    key = $el.data('key');

                addTranslation($el, key);
                htmlToMarkdown($el, key);
                stylise(el);
            });

            $('textarea').elastic();
            $('.doc-buttons').show();
        },

        isLoggedIn = function (ev) {
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

    // upload initial file
    // $.get(masterfile, render);

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