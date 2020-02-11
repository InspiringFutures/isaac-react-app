import {securePadCredentials, utf8ByteLength} from '../../app/services/credentialPadding';

describe("Unicode string lengths in Bytes",  () => {
    it("length of ASCII string", async () => {
        const expectedResult = 6;
        const actualResult = utf8ByteLength("123456");
        expect(actualResult).toEqual(expectedResult);
    });

    it("length of a Unicode string", async () => {
        const expectedResult = 34;
        const actualResult = utf8ByteLength("Iñtërnâtiônàlizætiøn☃💩");
        expect(actualResult).toEqual(expectedResult);
    });

});

describe("Credentials are securely padded",  () => {
    const credentials = {email: "test@test.com", password: "test"};
    const paddedCredentials = securePadCredentials(credentials);

    it("credential padding added", async () => {
        expect(paddedCredentials._randomPadding).toEqual(expect.anything());
    });

    it("credential padding length >= 0", () => {
        expect(paddedCredentials._randomPadding.length).toBeGreaterThan(0);
    });

    it("padded length = 256", () => {
        let paddedLength = utf8ByteLength(JSON.stringify(paddedCredentials));
        expect(paddedLength).toEqual(256);
    });

    it("long credential padding 2^N", () => {
        let longCredentials = {email: "test@test.com", password: "a".repeat(300)};
        let paddedLongCredentials = securePadCredentials(longCredentials);
        let paddedLength = utf8ByteLength(JSON.stringify(paddedLongCredentials));
        let log2OfLength = Math.log2(paddedLength);
        let intergerPowerOfTwo = Math.floor(log2OfLength);
        expect(log2OfLength).toEqual(intergerPowerOfTwo);
    });
});
