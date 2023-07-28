import {apply, move, template, url} from "@angular-devkit/schematics";

export function createLoaderFile({ ssr, loaderPath }) {
    return apply(url(`./files/transloco-loader`), [
        template({
            ts: 'ts',
            loaderPrefix: ssr ? '${environment.baseUrl}' : '',
        }),
        move('/', loaderPath),
    ]);
}
