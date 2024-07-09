"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = sleep;
exports.waitTil = waitTil;
function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(undefined);
        }, ms);
    });
}
function waitTil(func) {
    return new Promise(resolve => {
        const waitFunc = () => {
            if (func()) {
                resolve(true);
            }
            else {
                setTimeout(waitFunc, 100);
            }
        };
        waitFunc();
    });
}
