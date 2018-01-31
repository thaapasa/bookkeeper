import 'jest';
import { underscoreToCamelCase } from './Util';

describe('strings', () => {

    describe('underscoreToCamelCase', () => {

        it('should convert case correctly', () => {
            expect(underscoreToCamelCase('simple')).toEqual('simple');
            expect(underscoreToCamelCase('my_variable')).toEqual('myVariable');
            expect(underscoreToCamelCase('very_long_name')).toEqual('veryLongName');
            expect(underscoreToCamelCase('')).toEqual('');
        });

        it('should give empty string for non-strings', () => {
            expect(underscoreToCamelCase(null)).toEqual('');
            expect(underscoreToCamelCase(undefined)).toEqual('');
            expect(underscoreToCamelCase(5)).toEqual('5');
        });
    });

});
