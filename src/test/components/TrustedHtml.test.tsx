import katex from "katex";

import {katexify} from '../../app/components/elements/TrustedHtml';

jest.mock("katex");

const html = ["<div>foo</div><p><b>bar</b>", "</span></p>"];
const math = ["e = mc^2"];
const nestedDollars = ["GDP = 100,000,000\\\\textrm{$}", "GDP = 100\\$"];
const LATEX = "LATEX";

function wrapIn(open: string, what: string, close: string): string {
    return open + what + close;
}

const delimiters: [string, boolean, string][] = [
    ['$', false, '$'], ['\\(', false, '\\)'],
    ['$$', true, '$$'], ['\\[', true, '\\]'], ["\\begin{equation}", true, "\\end{equation}"]
];

describe('TrustedHtml LaTeX locator', () => {

    beforeEach(() => {
        // @ts-ignore
        katex.renderToString.mockImplementation(() => LATEX);
    });
    it('can find basic delimiters', () => {
        delimiters.forEach(([open, displayMode, close]) => {
            const testcase = html[0] + wrapIn(open, math[0], close) + html[1];
            const result = katexify(testcase, null, null, false, {});

            expect(result).toEqual(html[0] + LATEX + html[1]);
            // @ts-ignore
            const callArgs = katex.renderToString.mock.calls.pop();
            expect(callArgs[0]).toBe(math[0]);
            expect(callArgs[1]).toMatchObject({"displayMode": displayMode});
        });
    });

    it("unbalanced delimiters don't break everything but instead are just skipped", () => {
        delimiters.forEach(([open, , ]) => {
            const testcase = html[0] + wrapIn(open, math[0], "") + html[1];
            const result = katexify(testcase, null, null, false, {});

            expect(result).toEqual(html[0] + open + math[0] + html[1]);
            expect(katex.renderToString).not.toHaveBeenCalled();
        });
    });

    it('nested $ are fine', () => {
        nestedDollars.forEach((dollarMath) => {
            delimiters.forEach(([open, displayMode, close]) => {
                const testcase = html[0] + wrapIn(open, dollarMath, close) + html[1];
                const result = katexify(testcase, null, null, false, {});

                expect(result).toEqual(html[0] + LATEX + html[1]);
                // @ts-ignore
                const callArgs = katex.renderToString.mock.calls.pop();
                expect(callArgs[0]).toBe(dollarMath);
                expect(callArgs[1]).toMatchObject({"displayMode": displayMode});
            });
        });
    });

    it('can render environments', () => {
        const env = "\\begin{aligned}" + math[0] + "\\end{aligned}";
        const testcase = html[0] + env + html[1];
        const result = katexify(testcase, null, null, false, {});

        expect(result).toEqual(html[0] + LATEX + html[1]);
        // @ts-ignore
        const callArgs = katex.renderToString.mock.calls.pop();
        expect(callArgs[0]).toBe(env);
        expect(callArgs[1]).toMatchObject({"displayMode": true});
    });

    it('missing refs show an inline error', () => {
        const ref = "\\ref{foo[234o89tdgfiuno34£\"$%^Y}";
        const testcase = html[0] + ref + html[1];
        const result = katexify(testcase, null, null, false, {});

        expect(result).toEqual(html[0] + "unknown reference " + ref + html[1]);
        expect(katex.renderToString).not.toHaveBeenCalled();
    });

    it('found refs show their figure number', () => {
        const ref = "\\ref{foo}";
        const testcase = html[0] + ref + html[1];
        const result = katexify(testcase, null, null, false, {foo: 42});

        expect(result).toEqual(html[0] + "Figure 42" + html[1]);
        expect(katex.renderToString).not.toHaveBeenCalled();
    });

    it('ignores escaped dollars', () => {
        const escapedDollar = "\\$";
        const unescapedDollar = "$";
        const testcase = html[0] + escapedDollar + html[1];
        const result = katexify(testcase, null, null, false, {});

        expect(result).toEqual(html[0] + unescapedDollar + html[1]);
        expect(katex.renderToString).not.toHaveBeenCalled();
    });
});
