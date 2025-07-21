const { expect } = require('chai');
const { ConfigValidator } = require('../src/activityFeedFilter.user');
const merge = require('lodash.merge');

describe('ConfigValidator', () => {
    const defaultConfig = {
        remove: {
            uncommented: false,
            unliked: false,
            text: false,
            images: false,
            gifs: false,
            videos: false,
            containsStrings: [],
        },
        options: {
            targetLoadCount: 10,
            caseSensitive: false,
            linkedConditions: [],
            reverseConditions: false,
        },
        runOn: {
            home: false,
            social: false,
            profile: false,
            guestHome: false,
        },
    };

    const generateMergedConfig = (configOverrides) => merge({}, defaultConfig, configOverrides);

    const validateAndCheckErrors = (config, errorMessage) => {
        it(`should validate the configuration and throw error: ${errorMessage}`, () => {
            const validator = new ConfigValidator(config);
            expect(() => validator.validateConfig()).to.throw(errorMessage);
        });
    };

    const validConfig = generateMergedConfig({
        remove: {
            containsStrings: ['A'],
            notContainsStrings: [['A']],
        },
        options: {
            linkedConditions: ['uncommented', 'unliked', 'text', 'images', 'gifs', 'videos', 'containsStrings'],
        },
    });

    const testCases = [
        { config: validConfig, errorMessage: null }, // A valid config with no error

        {
            config: generateMergedConfig({
                remove: {
                    uncommented: 'invalid',
                    unliked: 123,
                    text: 'invalid',
                },
            }),
            errorMessage: /should be a boolean/,
        },
        {
            config: generateMergedConfig({
                options: {
                    targetLoadCount: 0,
                },
            }),
            errorMessage: /should be a positive non-zero integer/,
        },
    ];

    testCases.forEach(({ config, errorMessage }) => {
        if (errorMessage) {
            validateAndCheckErrors(config, errorMessage);
        } else {
            it('should validateConfig a valid configuration without errors', () => {
                const validator = new ConfigValidator(config);
                expect(() => validator.validateConfig()).to.not.throw();
            });
        }
    });
});