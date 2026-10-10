import { CLI_SCRIPTS_TABLE, CliInvocation } from './cli-scripts-table';
import { parseScript } from './cli-scripts-shell';
import { translateScript } from './cli-scripts-translate';

describe('parseScript', () => {
  const values = (script: string) =>
    parseScript(script)?.map((command) =>
      command.map((token) =>
        token.kind === 'word' ? token.value : `<${token.raw}>`,
      ),
    );

  it(`GIVEN operators between commands
      WHEN a script is parsed
      THEN it is cut into one command per operator`, () => {
    expect(values('a x && b y || c; d | e & f\ng')).toEqual([
      ['a', 'x'],
      ['b', 'y'],
      ['c'],
      ['d'],
      ['e'],
      ['f'],
      ['g'],
    ]);
  });

  it(`GIVEN operators inside quotes
      WHEN a script is parsed
      THEN they stay in the word`, () => {
    expect(values(`a "x && y" 'b ; c' d\\;e`)).toEqual([
      ['a', 'x && y', 'b ; c', 'd;e'],
    ]);
  });

  it(`GIVEN a redirection
      WHEN a script is parsed
      THEN it is one token with its target, and 2>&1 is no operator`, () => {
    expect(values('a x > out.log 2>&1 && b')).toEqual([
      ['a', 'x', '<> out.log>', '<2>&1>'],
      ['b'],
    ]);
  });

  it(`GIVEN a command substitution holding parentheses and quotes
      WHEN a script is parsed
      THEN it is one word and the script is not cut inside it`, () => {
    expect(parseScript(`a $(b ")" && c) d`)?.[0]).toHaveLength(3);
  });

  it(`GIVEN a comment
      WHEN a script is parsed
      THEN it is not a command`, () => {
    expect(values('a x # b y')).toEqual([['a', 'x']]);
  });

  it.each([`a "b`, `a 'b`, `a $(b`, 'a `b'])(
    `GIVEN the script %s that never closes a quote
      WHEN it is parsed
      THEN it can't be read`,
    (script) => {
      expect(parseScript(script)).toBeNull();
    },
  );
});

describe('translateScript', () => {
  /** Script, and what it becomes. */
  const rewrites: Array<[string, string]> = [
    // transloco-keys-manager, in every spelling it accepts
    ['transloco-keys-manager extract', 'transloco extract'],
    ['transloco-keys-manager find', 'transloco find'],
    [
      'transloco-keys-manager extract --input src --output src/assets/i18n --langs en es',
      'transloco extract --input src --output src/assets/i18n --langs en es',
    ],
    [
      'transloco-keys-manager extract -i src -o i18n -l en -l es',
      'transloco extract -i src -o i18n -l en -l es',
    ],
    [
      'transloco-keys-manager extract --input=src --output=i18n --default-value=TODO',
      'transloco extract --input=src --output=i18n --default-value=TODO',
    ],
    [
      'transloco-keys-manager extract --input src,projects/ui/src --project app',
      'transloco extract --input src,projects/ui/src --project app',
    ],
    [
      'transloco-keys-manager extract -c transloco.config.js -f pot -m marker',
      'transloco extract -c transloco.config.js -f pot -m marker',
    ],
    [
      'transloco-keys-manager extract --file-format json --config ./conf.js',
      'transloco extract --file-format json --config ./conf.js',
    ],
    [
      'transloco-keys-manager extract --sort --unflat --replace --remove-extra-keys',
      'transloco extract --sort --unflat --replace --remove-extra-keys',
    ],
    [
      'transloco-keys-manager extract -s -u -r -R',
      'transloco extract -s -u -r -R',
    ],
    ['transloco-keys-manager extract -su', 'transloco extract -su'],
    ['transloco-keys-manager extract -suR', 'transloco extract -suR'],
    ['transloco-keys-manager extract -d TODO', 'transloco extract -d TODO'],
    [
      'transloco-keys-manager extract --default-value ""',
      'transloco extract --default-value ""',
    ],
    ["transloco-keys-manager extract -d ''", "transloco extract -d ''"],
    [
      'transloco-keys-manager find --translations-path src/assets/i18n --add-missing-keys --emit-error-on-extra-keys',
      'transloco find --translations-path src/assets/i18n --add-missing-keys --emit-error-on-extra-keys',
    ],
    [
      'transloco-keys-manager find -p src/assets/i18n -a -e -i src',
      'transloco find -p src/assets/i18n -a -e -i src',
    ],
    ['transloco-keys-manager find -ae', 'transloco find -ae'],
    // options the command accepted but never read are dropped
    [
      'transloco-keys-manager extract --translations-path src/assets/i18n',
      'transloco extract',
    ],
    [
      'transloco-keys-manager extract -i src -p src/assets/i18n -o i18n',
      'transloco extract -i src -o i18n',
    ],
    [
      'transloco-keys-manager extract --add-missing-keys --emit-error-on-extra-keys -i src',
      'transloco extract -i src',
    ],
    ['transloco-keys-manager extract -i src -a -e', 'transloco extract -i src'],
    ['transloco-keys-manager extract -a -i src', 'transloco extract -i src'],
    [
      'transloco-keys-manager find -i src --output out --langs en es --replace --remove-extra-keys',
      'transloco find -i src',
    ],
    [
      'transloco-keys-manager find --langs en es -i src',
      'transloco find -i src',
    ],
    ['transloco-keys-manager find -l en -i src -r -R', 'transloco find -i src'],
    [
      'transloco-keys-manager find -o out -i src -r -R -s',
      'transloco find -i src -s',
    ],
    ['transloco-keys-manager find -sr -i src', 'transloco find -s -i src'],
    ['transloco-keys-manager find -r', 'transloco find'],
    ['transloco-keys-manager find --langs=en -i src', 'transloco find -i src'],
    // transloco-validator
    [
      'transloco-validator src/assets/i18n/en.json',
      'transloco validate src/assets/i18n/en.json',
    ],
    [
      'transloco-validator a.json b.json c.json',
      'transloco validate a.json b.json c.json',
    ],
    [
      'transloco-validator src/assets/i18n/*.json',
      'transloco validate src/assets/i18n/*.json',
    ],
    [
      'transloco-validator "src/my app/en.json" \'src/other/es.json\'',
      'transloco validate "src/my app/en.json" \'src/other/es.json\'',
    ],
    // transloco-optimize
    [
      'transloco-optimize dist/app/browser',
      'transloco optimize dist/app/browser',
    ],
    ['transloco-optimize -d dist/app', 'transloco optimize -d dist/app'],
    [
      'transloco-optimize --dist dist/app',
      'transloco optimize --dist dist/app',
    ],
    [
      'transloco-optimize --dist=dist/app',
      'transloco optimize --dist=dist/app',
    ],
    [
      'transloco-optimize dist/app --commentsKey remark',
      'transloco optimize dist/app --comments-key remark',
    ],
    [
      'transloco-optimize dist/app --commentsKey=remark',
      'transloco optimize dist/app --comments-key=remark',
    ],
    [
      'transloco-optimize dist/app -k remark',
      'transloco optimize dist/app -k remark',
    ],
    [
      'transloco-optimize -k remark dist/app',
      'transloco optimize -k remark dist/app',
    ],
    [
      'transloco-optimize -d dist/app --commentsKey remark',
      'transloco optimize -d dist/app --comments-key remark',
    ],
    ['transloco-optimize "dist/my app"', 'transloco optimize "dist/my app"'],
    // transloco-scoped-libs
    ['transloco-scoped-libs', 'transloco scoped-libs'],
    ['transloco-scoped-libs --watch', 'transloco scoped-libs --watch'],
    ['transloco-scoped-libs -w', 'transloco scoped-libs -w'],
    [
      'transloco-scoped-libs --skip-gitignore',
      'transloco scoped-libs --skip-gitignore',
    ],
    ['transloco-scoped-libs -m', 'transloco scoped-libs --skip-gitignore'],
    [
      'transloco-scoped-libs -w -m',
      'transloco scoped-libs -w --skip-gitignore',
    ],
    ['transloco-scoped-libs -wm', 'transloco scoped-libs -w --skip-gitignore'],
    ['transloco-scoped-libs -mw', 'transloco scoped-libs --skip-gitignore -w'],
    // chains
    [
      'ng build && transloco-optimize dist/app/browser',
      'ng build && transloco optimize dist/app/browser',
    ],
    [
      'transloco-keys-manager extract && transloco-keys-manager find',
      'transloco extract && transloco find',
    ],
    [
      'transloco-validator a.json || echo "invalid"',
      'transloco validate a.json || echo "invalid"',
    ],
    [
      'echo start; transloco-scoped-libs -w; echo end',
      'echo start; transloco scoped-libs -w; echo end',
    ],
    [
      'transloco-scoped-libs -w & ng serve',
      'transloco scoped-libs -w & ng serve',
    ],
    [
      'ng serve & transloco-scoped-libs -w',
      'ng serve & transloco scoped-libs -w',
    ],
    [
      'transloco-validator a.json | tee check.log',
      'transloco validate a.json | tee check.log',
    ],
    [
      'echo x | transloco-validator a.json',
      'echo x | transloco validate a.json',
    ],
    [
      'rimraf dist && ng build && transloco-optimize dist/app -k remark && echo done',
      'rimraf dist && ng build && transloco optimize dist/app -k remark && echo done',
    ],
    [
      'transloco-keys-manager extract -i src\ntransloco-keys-manager find -i src',
      'transloco extract -i src\ntransloco find -i src',
    ],
    ['(transloco-validator a.json)', '(transloco validate a.json)'],
    [
      'if transloco-validator a.json; then echo ok; fi',
      'if transloco validate a.json; then echo ok; fi',
    ],
    [
      'true && ! transloco-validator a.json',
      'true && ! transloco validate a.json',
    ],
    // several candidates in one script
    [
      'transloco-keys-manager extract -p x -i src && transloco-keys-manager find -r -i src && transloco-validator a.json',
      'transloco extract -i src && transloco find -i src && transloco validate a.json',
    ],
    [
      'transloco-scoped-libs -m && transloco-keys-manager extract && transloco-optimize dist --commentsKey c',
      'transloco scoped-libs --skip-gitignore && transloco extract && transloco optimize dist --comments-key c',
    ],
    // a command that mentions a bin next to one that runs it
    [
      'echo transloco-keys-manager && transloco-keys-manager extract',
      'echo transloco-keys-manager && transloco extract',
    ],
    [
      'rimraf dist/transloco-optimize && transloco-optimize dist/app',
      'rimraf dist/transloco-optimize && transloco optimize dist/app',
    ],
    [
      'cat transloco-validator.log; transloco-validator a.json; grep transloco-validator x',
      'cat transloco-validator.log; transloco validate a.json; grep transloco-validator x',
    ],
    [
      'node scripts/transloco-optimize.js && transloco-optimize dist',
      'node scripts/transloco-optimize.js && transloco optimize dist',
    ],
    // environment variables in front
    [
      'NODE_ENV=production transloco-optimize dist/app',
      'NODE_ENV=production transloco optimize dist/app',
    ],
    [
      'A=1 B="x y" C=\'z\' transloco-validator f.json',
      'A=1 B="x y" C=\'z\' transloco validate f.json',
    ],
    ['A=$HOME transloco-validator f.json', 'A=$HOME transloco validate f.json'],
    [
      'cross-env NODE_ENV=production transloco-optimize dist/app',
      'cross-env NODE_ENV=production transloco optimize dist/app',
    ],
    [
      'cross-env A=1 B=2 npx transloco-validator f.json',
      'cross-env A=1 B=2 npx transloco validate f.json',
    ],
    // wrappers
    ['npx transloco-keys-manager extract', 'npx transloco extract'],
    [
      'npx --no-install transloco-keys-manager find -i src',
      'npx --no-install transloco find -i src',
    ],
    ['npx -y transloco-validator a.json', 'npx -y transloco validate a.json'],
    [
      'npx --yes -q transloco-optimize dist',
      'npx --yes -q transloco optimize dist',
    ],
    ['npx -- transloco-scoped-libs -w', 'npx -- transloco scoped-libs -w'],
    ['bunx transloco-keys-manager extract', 'bunx transloco extract'],
    [
      'pnpm exec transloco-keys-manager extract -s',
      'pnpm exec transloco extract -s',
    ],
    [
      'pnpm exec -- transloco-validator a.json',
      'pnpm exec -- transloco validate a.json',
    ],
    ['yarn transloco-optimize dist', 'yarn transloco optimize dist'],
    ['yarn run transloco-scoped-libs -w', 'yarn run transloco scoped-libs -w'],
    [
      'yarn run --silent transloco-validator a.json',
      'yarn run --silent transloco validate a.json',
    ],
    ['npm exec transloco-keys-manager find', 'npm exec transloco find'],
    [
      'npm exec -- transloco-keys-manager find -i src',
      'npm exec -- transloco find -i src',
    ],
    [
      'npm exec --yes -- transloco-validator a.json',
      'npm exec --yes -- transloco validate a.json',
    ],
    [
      './node_modules/.bin/transloco-keys-manager extract',
      './node_modules/.bin/transloco extract',
    ],
    [
      'node_modules/.bin/transloco-validator a.json',
      'node_modules/.bin/transloco validate a.json',
    ],
    [
      'node node_modules/.bin/transloco-optimize dist',
      'node node_modules/.bin/transloco optimize dist',
    ],
    [
      'node ./node_modules/.bin/transloco-scoped-libs -w',
      'node ./node_modules/.bin/transloco scoped-libs -w',
    ],
    [
      'npx ./node_modules/.bin/transloco-validator a.json',
      'npx ./node_modules/.bin/transloco validate a.json',
    ],
    ['"transloco-validator" a.json', 'transloco validate a.json'],
    // quoting
    [
      'transloco-keys-manager extract --input "src/my app" --output \'i18n dir\'',
      'transloco extract --input "src/my app" --output \'i18n dir\'',
    ],
    [
      'transloco-keys-manager extract --default-value "Say \\"hi\\" now"',
      'transloco extract --default-value "Say \\"hi\\" now"',
    ],
    [
      'transloco-keys-manager extract --default-value="Hello world" -i src',
      'transloco extract --default-value="Hello world" -i src',
    ],
    [
      'transloco-keys-manager extract --default-value \'it is "ok"\'',
      'transloco extract --default-value \'it is "ok"\'',
    ],
    [
      'transloco-keys-manager extract -i src/my\\ app -o out',
      'transloco extract -i src/my\\ app -o out',
    ],
    [
      'transloco-keys-manager extract -p "src/my app" -i src',
      'transloco extract -i src',
    ],
    [
      "transloco-keys-manager extract -i src -p 'a b'",
      'transloco extract -i src',
    ],
    // redirections after the command are the shell's business
    [
      'transloco-validator a.json > check.log 2>&1',
      'transloco validate a.json > check.log 2>&1',
    ],
    [
      'transloco-optimize dist 2>/dev/null',
      'transloco optimize dist 2>/dev/null',
    ],
    [
      'transloco-keys-manager find -r > report.txt',
      'transloco find > report.txt',
    ],
    [
      'transloco-validator a.json &> check.log',
      'transloco validate a.json &> check.log',
    ],
    // everything around the command is left exactly as it was
    [
      '  transloco-validator   a.json \t b.json   &&   echo  "done"  ',
      '  transloco validate   a.json \t b.json   &&   echo  "done"  ',
    ],
    ['transloco-validator a.json # check', 'transloco validate a.json # check'],
    [
      'echo "x" ;transloco-validator a.json;echo y',
      'echo "x" ;transloco validate a.json;echo y',
    ],
    [
      'echo $HOME && transloco-validator a.json',
      'echo $HOME && transloco validate a.json',
    ],
    [
      'echo $(pwd) && transloco-validator a.json',
      'echo $(pwd) && transloco validate a.json',
    ],
    [
      'transloco-optimize dist &&\\\nrm -f x',
      'transloco optimize dist &&\\\nrm -f x',
    ],
  ];

  it.each(rewrites)(
    `GIVEN the script %s
      WHEN it is translated
      THEN it becomes %s`,
    (script, expected) => {
      const result = translateScript(script);

      expect(result).toMatchObject({ kind: 'rewritten', script: expected });
    },
  );

  it.each(rewrites)(
    `GIVEN the script %s was translated
      WHEN the result is translated again
      THEN nothing is left to translate`,
    (script) => {
      const result = translateScript(script);
      const translated = result.kind === 'rewritten' ? result.script : script;

      expect(translateScript(translated)).toEqual({ kind: 'none' });
    },
  );

  it.each([
    'echo transloco-keys-manager',
    'echo transloco-keys-manager extract',
    'rimraf dist/transloco-optimize',
    'cat package.json | grep transloco-validator',
    'node scripts/transloco-optimize.js dist',
    'npm run transloco-optimize',
    'npm run transloco-scoped-libs -- --watch',
    'node transloco-optimize dist',
    'node --no-warnings transloco-optimize dist',
    'ng build --configuration production',
    'echo "build" && transloco extract -i src',
    'transloco validate a.json',
    'git add transloco-validator.log',
    'mkdir -p out/transloco-keys-manager',
    'tsc -p libs/transloco-validator/tsconfig.json',
    'npx some-tool transloco-validator',
    'yarn build transloco-optimize',
    'FOO=transloco-optimize echo done',
    'cp ./node_modules/@jsverse/transloco-keys-manager/README.md docs/',
    'echo @jsverse/transloco-keys-manager',
    '',
  ])(
    `GIVEN the script %j that runs none of the deprecated bins
      WHEN it is translated
      THEN it is not touched`,
    (script) => {
      expect(translateScript(script)).toEqual({ kind: 'none' });
    },
  );

  /** Script, and a part of the reason why it is left alone. */
  const left: Array<[string, string]> = [
    // an option the table doesn't know
    [
      'transloco-keys-manager extract --bogus',
      '--bogus is not an option of transloco-keys-manager extract',
    ],
    [
      'transloco-keys-manager extract --translationsPath src',
      '--translationsPath is not an option',
    ],
    [
      'transloco-keys-manager extract --defaultValue TODO',
      '--defaultValue is not an option',
    ],
    [
      'transloco-keys-manager find --addMissingKeys',
      '--addMissingKeys is not an option',
    ],
    [
      'transloco-keys-manager extract --fileFormat pot',
      '--fileFormat is not an option',
    ],
    ['transloco-keys-manager extract -x', '-x is not an option'],
    [
      'transloco-optimize dist --comments-key remark',
      '--comments-key is not an option',
    ],
    ['transloco-optimize dist -x', '-x is not an option'],
    ['transloco-scoped-libs -c conf.js', '-c is not an option'],
    ['transloco-scoped-libs --config conf.js', '--config is not an option'],
    ['transloco-scoped-libs -x', '-x is not an option'],
    ['transloco-scoped-libs -wx', '-x in -wx is not an option'],
    // options with no counterpart
    ['transloco-keys-manager extract --help', '--help: '],
    ['transloco-keys-manager find -h', '-h: '],
    ['transloco-keys-manager extract -ah', '-h: '],
    // the command
    ['transloco-keys-manager', 'is not given extract or find'],
    [
      'transloco-keys-manager --input src extract',
      'is not given extract or find, but --input',
    ],
    [
      'transloco-keys-manager bogus -i src',
      'is not given extract or find, but bogus',
    ],
    // arguments the legacy parser rejects or reads differently
    ['transloco-keys-manager extract foo', "is given 'foo'"],
    ['transloco-scoped-libs foo', "is given 'foo'"],
    ['transloco-keys-manager extract --', "'--' ends the options"],
    ['transloco-validator -- a.json', "'--' ends the options"],
    [
      'transloco-keys-manager extract --input src --input lib',
      '--input is given more than once',
    ],
    [
      'transloco-keys-manager extract -i src --input lib',
      '--input is given more than once',
    ],
    ['transloco-keys-manager extract -s -s', '-s is given more than once'],
    ['transloco-keys-manager extract --sort -s', '-s is given more than once'],
    ['transloco-keys-manager extract -ss', '-s is given more than once'],
    ['transloco-scoped-libs -w -w', '-w is given more than once'],
    ['transloco-scoped-libs -w --watch', '--watch is given more than once'],
    [
      'transloco-optimize dist --commentsKey a -k b',
      '-k is given more than once',
    ],
    ['transloco-keys-manager extract --sort=true', '--sort takes no value'],
    ['transloco-scoped-libs --watch=true', '--watch takes no value'],
    ['transloco-keys-manager extract -isrc', "can't share its dash in -isrc"],
    [
      'transloco-keys-manager extract -i=src',
      'attaches a value to a short option',
    ],
    [
      'transloco-keys-manager extract -c=conf.js',
      'attaches a value to a short option',
    ],
    [
      'transloco-keys-manager extract -so out',
      "-o takes a value, which can't share its dash in -so",
    ],
    ['transloco-optimize -kremark dist', 'in -kremark'],
    [
      'transloco-keys-manager extract -input src',
      "-i takes a value, which can't share its dash in -input",
    ],
    ['transloco-keys-manager extract -i', '-i is given no value'],
    ['transloco-keys-manager extract --langs', '--langs is given no value'],
    [
      'transloco-keys-manager extract -i -s',
      "-i is given '-s', which starts with a dash",
    ],
    [
      'transloco-keys-manager extract --output --sort',
      'which starts with a dash',
    ],
    [
      'transloco-keys-manager extract --langs=en es',
      '--langs= is followed by more values',
    ],
    // empty values
    [
      'transloco-keys-manager extract --input ""',
      '--input is given an empty value',
    ],
    ["transloco-keys-manager extract -i ''", '-i is given an empty value'],
    [
      'transloco-keys-manager extract --input=',
      '--input is given an empty value',
    ],
    ['transloco-keys-manager extract -m ""', '-m is given an empty value'],
    [
      'transloco-keys-manager extract --output " "',
      '--output is given an empty value',
    ],
    ['transloco-keys-manager extract -l en ""', '-l is given an empty value'],
    ['transloco-keys-manager find -p ""', '-p is given an empty value'],
    ['transloco-keys-manager extract -f ""', '-f is given an empty value'],
    ['transloco-keys-manager extract -c ""', '-c is given an empty value'],
    ['transloco-optimize dist -k ""', '-k is given an empty value'],
    ['transloco-optimize ""', 'the dist folder is empty'],
    ['transloco-optimize -d ""', '-d is given an empty value'],
    ['transloco-keys-manager find -o "" -i src', '-o is given an empty value'],
    // values the new bin takes differently
    [
      'transloco-keys-manager extract -f xml',
      "-f is given 'xml', the transloco bin takes json or pot",
    ],
    ['transloco-keys-manager extract --file-format yaml', "'yaml'"],
    ['transloco-keys-manager extract -i src,,lib', '-i holds an empty path'],
    ['transloco-keys-manager extract -i ,src', '-i holds an empty path'],
    [
      'transloco-keys-manager extract --input "src, "',
      '--input holds an empty path',
    ],
    // validator and optimize
    ['transloco-validator', 'is given no file'],
    ['transloco-validator --help', 'is taken as a file by transloco-validator'],
    [
      'transloco-validator -x a.json',
      'is taken as a file by transloco-validator',
    ],
    [
      'transloco-validator a.json -',
      'is taken as a file by transloco-validator',
    ],
    ['transloco-optimize', 'no dist folder is given'],
    ['transloco-optimize -k remark', 'no dist folder is given'],
    ['transloco-optimize dist other', 'the dist folder is given twice'],
    ['transloco-optimize -d a -d b', '-d is given more than once'],
    ['transloco-optimize dist -d other', 'the dist folder is given twice'],
    ['transloco-optimize -d other dist', 'the dist folder is given twice'],
    // what the shell works out
    [
      'transloco-keys-manager extract --input $SRC',
      '$SRC is worked out by the shell',
    ],
    [
      'transloco-keys-manager extract --input "$SRC/app"',
      'is worked out by the shell',
    ],
    [
      'transloco-keys-manager extract --input ${SRC}',
      'is worked out by the shell',
    ],
    [
      'transloco-keys-manager extract $FLAGS',
      '$FLAGS is worked out by the shell',
    ],
    [
      'transloco-keys-manager extract $FLAG -i src',
      '$FLAG is worked out by the shell',
    ],
    [
      'transloco-keys-manager extract --input $(pwd)/src',
      'is worked out by the shell',
    ],
    [
      'transloco-keys-manager extract --input `pwd`/src',
      'is worked out by the shell',
    ],
    [
      'transloco-keys-manager extract --langs {en,es}',
      '{en,es} is worked out by the shell',
    ],
    [
      'transloco-keys-manager extract --langs en${EXTRA}',
      'is worked out by the shell',
    ],
    ['transloco-validator $FILES', '$FILES is worked out by the shell'],
    ['transloco-validator "$DIR"/*.json', 'is worked out by the shell'],
    ['transloco-optimize $DIST', '$DIST is worked out by the shell'],
    ['transloco-scoped-libs $WATCH', '$WATCH is worked out by the shell'],
    // wrappers that name the package, or whose options aren't read
    [
      'npx @jsverse/transloco-keys-manager extract',
      'is a package that is fetched by name',
    ],
    [
      'npx -y @jsverse/transloco-validator a.json',
      'is a package that is fetched by name',
    ],
    [
      'npx @jsverse/transloco-optimize@9 dist',
      'is a package that is fetched by name',
    ],
    [
      'npx transloco-keys-manager@latest extract',
      'is a package that is fetched by name',
    ],
    [
      'pnpm dlx @jsverse/transloco-keys-manager extract',
      'is a package that is fetched by name',
    ],
    ['pnpm dlx transloco-validator a.json', 'is run through pnpm dlx'],
    [
      'npx -p @jsverse/transloco-validator transloco-validator a.json',
      'is run through a wrapper whose options',
    ],
    [
      'npx --package=@jsverse/transloco-optimize transloco-optimize dist',
      'is run through a wrapper whose options',
    ],
    [
      'pnpm exec -r transloco-validator a.json',
      'is run through a wrapper whose options',
    ],
    [
      'npm exec -c transloco-optimize dist',
      'is run through a wrapper whose options',
    ],
    // the shape of the command line
    [
      'transloco-validator > out.log a.json',
      'a redirection stands in the middle',
    ],
    ['transloco-validator 2>&1 a.json', 'a redirection stands in the middle'],
    [
      '> out.log transloco-validator a.json',
      'a redirection stands in front of',
    ],
    // a bin run from where this migration does not read
    [
      'concurrently "ng serve" "transloco-scoped-libs --watch"',
      'transloco-scoped-libs is run from inside a quoted argument',
    ],
    [
      "concurrently 'ng serve' 'transloco-scoped-libs -w'",
      'is run from inside a quoted argument',
    ],
    [
      'bash -c "transloco-optimize dist"',
      'transloco-optimize is run from inside a quoted argument',
    ],
    [
      'sh -c "cd app && transloco-validator a.json"',
      'is run from inside a quoted argument',
    ],
    [
      'echo $(transloco-validator a.json)',
      'transloco-validator is run from inside a quoted argument or a substitution',
    ],
    [
      'echo `transloco-optimize dist`',
      'is run from inside a quoted argument or a substitution',
    ],
    [
      'echo "$(transloco-keys-manager find)"',
      'is run from inside a quoted argument or a substitution',
    ],
    [
      'run-p "transloco-keys-manager extract" "ng serve"',
      'is run from inside a quoted argument',
    ],
    ['run-s "transloco-validator"', 'is run from inside a quoted argument'],
    // the whole script is left, not the command alone
    [
      'transloco-validator a.json && transloco-optimize',
      'no dist folder is given',
    ],
    [
      'transloco-keys-manager extract -i src && transloco-keys-manager find --bogus',
      '--bogus is not an option',
    ],
    [
      'transloco-scoped-libs -m && concurrently "transloco-optimize dist"',
      'is run from inside a quoted argument',
    ],
    ['transloco-validator "a.json', 'never closed'],
    ["transloco-validator 'a.json", 'never closed'],
  ];

  it.each(left)(
    `GIVEN the script %s
      WHEN it is translated
      THEN it is left alone and the reason is given: %s`,
    (script, reason) => {
      const result = translateScript(script);

      expect(result.kind).toBe('left');
      expect(result).toMatchObject({ reason: expect.stringContaining(reason) });
    },
  );

  it(`GIVEN a script with one command that can be translated and one that can't
      WHEN it is translated
      THEN none of it is rewritten`, () => {
    const result = translateScript(
      'transloco-validator a.json && transloco-optimize dist -x',
    );

    expect(result).toEqual({
      kind: 'left',
      reason: '-x is not an option of transloco-optimize',
    });
  });

  it(`GIVEN several deprecated bins in a script
      WHEN it is translated
      THEN each one is reported in order`, () => {
    const result = translateScript(
      'transloco-scoped-libs -m && transloco-keys-manager extract && transloco-validator a.json && transloco-optimize dist',
    );

    expect(result).toMatchObject({
      kind: 'rewritten',
      bins: [
        'transloco-scoped-libs',
        'transloco-keys-manager',
        'transloco-validator',
        'transloco-optimize',
      ],
    });
  });

  describe('every option of the table', () => {
    /** A value the option takes, which doesn't trip any of the checks on it. */
    const valueFor = (option: CliInvocation['options'][number]) =>
      option.choices?.[0] ?? (option.list ? 'src,lib' : 'alpha');

    const bin = (invocation: CliInvocation) =>
      [invocation.bin, invocation.command].filter(Boolean).join(' ');

    const lines = CLI_SCRIPTS_TABLE.invocations.flatMap((invocation) => {
      const target =
        invocation.to + (invocation.command ? ` ${invocation.command}` : '');

      return invocation.options
        .filter(({ outcome }) => outcome !== 'leave')
        .flatMap((option) => {
          // The folder is given by the option itself, or next to it
          const positional =
            invocation.positionals === 'files'
              ? ' a.json'
              : invocation.positionals === 'dist' && option.name !== 'dist'
                ? ' dist'
                : '';

          return Object.entries(option.spellings).flatMap(
            ([spelling, becomes]) => {
              const typed = option.takesValue
                ? [
                    `${spelling} ${valueFor(option)}`,
                    `${spelling}=${valueFor(option)}`,
                  ].filter(
                    (typed) =>
                      spelling.startsWith('--') || !typed.includes('='),
                  )
                : [spelling];

              return typed.map((words) => {
                // The tail is what follows the option: the positional the command needs
                const kept = becomes
                  ? words.replace(spelling, becomes)
                  : undefined;

                return [
                  `${bin(invocation)}${positional} ${words}`,
                  `${target}${positional}${kept ? ` ${kept}` : ''}`,
                  option.outcome,
                ] as [string, string, string];
              });
            },
          );
        });
    });

    it('GIVEN the table WHEN its lines are built THEN there are plenty', () => {
      expect(lines.length).toBeGreaterThan(70);
    });

    it.each(lines)(
      `GIVEN the script %s
        WHEN it is translated
        THEN it becomes %s (%s)`,
      (script, expected) => {
        expect(translateScript(script)).toMatchObject({
          kind: 'rewritten',
          script: expected,
        });
      },
    );

    it.each(
      CLI_SCRIPTS_TABLE.invocations.flatMap((invocation) =>
        invocation.options
          .filter(({ outcome }) => outcome === 'leave')
          .flatMap((option) =>
            Object.keys(option.spellings).map(
              (spelling) => [`${bin(invocation)} ${spelling}`] as [string],
            ),
          ),
      ),
    )(
      `GIVEN the script %s using an option that has no counterpart
        WHEN it is translated
        THEN it is left alone`,
      (script) => {
        expect(translateScript(script).kind).toBe('left');
      },
    );
  });
});
