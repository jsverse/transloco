# Generate Locale Files using Google Translate

This script, originally shared by born2net (#261), reads the `en.json` translation file and generates localized translation files for various languages. The script utilizes Google Translate to automatically populate translations and saves them as JSON files in your project’s `i18n` directory.

## **Steps to Use:**

{% stepper %}
{% step %}
Install `google-translate` package

{% tabs %}
{% tab title="pnpm" %}
```bash
pnpm add google-translate
```
{% endtab %}

{% tab title="yarn" %}
```bash
yarn add google-translate
```
{% endtab %}

{% tab title="npm" %}
```bash
npm i google-translate
```
{% endtab %}
{% endtabs %}
{% endstep %}

{% step %}
Uncomment `createLocalFiles()` once to generate all necessary files (e.g., `he.json`, `ca.json`, etc.)
{% endstep %}

{% step %}
Comment or delete `createLocalFiles()` once the files have been created.
{% endstep %}

{% step %}
Set your Google API key in `process.env.GOOGLE_KEY`
{% endstep %}

{% step %}
Run the provided script to populate translations. Re-run it whenever you update your `en.json`
{% endstep %}
{% endstepper %}

```javascript
#!/usr/bin/env node
const fs = require('fs');
const googleTranslate = require('google-translate')(process.env.GOOGLE_KEY);
const i18Dir = './src/assets/i18n';
const defaultSourceLang = 'en';

const codes = {
    Afrikaans: 'af',
    Irish: 'ga',
    Albanian: 'sq',
    Italian: 'it',
    Arabic: 'ar',
    Japanese: 'ja',
    // Add more languages here...
    English: 'en',
    Spanish: 'es',
};

let createLocalFiles = () => {
    Object.values(codes).forEach((local) => {
        if (local === defaultSourceLang) return;
        const p = `./src/assets/i18n/${local}.json`;
        if (fs.existsSync(p)) {
            console.log('exists ' + p);
        } else {
            fs.writeFileSync(p, '', { encoding: 'utf8', flag: 'w' });
        }
    });
};

// Uncomment to create files once
// createLocalFiles();

let sourceFile = (local) => {
    try {
        return JSON.parse(fs.readFileSync(`./src/assets/i18n/${local}.json`, 'utf8'));
    } catch (e) {
        return null;
    }
};

let getLocals = () => {
    return new Promise((resolve, reject) => {
        const locals = [];
        fs.readdir(i18Dir, (err, files) => {
            files.forEach(file => {
                if (file === `${defaultSourceLang}.json`) return;
                file = file.replace(/\.json/, '');
                locals.push(file);
            });
            resolve(locals);
        });
    });
};

let translate = (word, local) => {
    return new Promise((resolve, reject) => {
        googleTranslate.translate(word, local, function (err, translation) {
            if (translation === undefined) {
                console.log('>> google error ' + err + ' ' + word + ' ' + local);
            } else {
                var translated = cleanProbCharactersV2(translation.translatedText);
            }
            resolve(translated);
        });
    });
};

const cleanProbCharactersV2 = (i_string) => {
    i_string = i_string.replace(/'/ig, "");
    i_string = i_string.replace(/"/ig, "");
    i_string = i_string.replace(/}/ig, "");
    i_string = i_string.replace(/{/ig, "");
    i_string = i_string.replace(/\)/ig, "");
    i_string = i_string.replace(/\r/ig, "");
    i_string = i_string.replace(/\n/ig, "");
    i_string = i_string.replace(/()/ig, "");
    return i_string;
};

const localSource = sourceFile(defaultSourceLang);

(async function asyncConnect() {
    try {
        const languages = await getLocals();
        for (let i = 0; i < languages.length; i++) {
            let final = {};
            const local = languages[i];
            console.log('processing local ' + local + ' >>>');
            const destlSource = sourceFile(local);
            if (destlSource) {
                final = destlSource;
            }
            for (section in localSource) {
                if (!final[section]) final[section] = {};
                const words = localSource[section];
                for (word in words) {
                    if (destlSource && destlSource[section] && destlSource[section][word]) {
                        final[section][word] = destlSource[section][word];
                    } else {
                        console.log('   >>> ' + section + ' ' + words[word]);
                        const newWord = await translate(words[word], local);
                        console.log('       ### translated to ' + newWord);
                        final[section][word] = newWord;
                    }
                }
            }
            const f = i18Dir + '/' + local + '.json';
            try {
                fs.writeFileSync(f, JSON.stringify(final, null, '\t'), { encoding: 'utf8', flag: 'w' });
            } catch (err) {
                console.error(err);
            }
        }
    } catch (err) {
        console.log('problem encountered ' + err);
    }
})();
```

**Expected Output:**

When you run this script, it will generate or update translation files for each specified language based on the English `en.json` file. The translations will be fetched from Google Translate and added to the corresponding localized JSON file.
