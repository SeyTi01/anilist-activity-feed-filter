const fs = require('fs');
const jsdom = require('jsdom');
const path = require('path');
const { expect } = require('chai');
const { ActivityHandler } = require('../src/activityFeedFilter.user');
const { restore, spy } = require("sinon");
const merge = require('lodash.merge');

const TEST_DATA_PATH = './tests/data/';
const UNLIKED = `${TEST_DATA_PATH}activity-unliked.html`;
const UNCOMMENTED = `${TEST_DATA_PATH}activity-uncommented.html`;
const TEXT = `${TEST_DATA_PATH}activity-text.html`;
const MESSAGE = `${TEST_DATA_PATH}activity-message.html`;
const IMAGES = `${TEST_DATA_PATH}activity-images.html`;
const VIDEOS = `${TEST_DATA_PATH}activity-videos.html`;
const VIDEOS_YOUTUBE = `${TEST_DATA_PATH}activity-videosYoutube.html`;
const CONTAINS_STRING_1 = `${TEST_DATA_PATH}activity-containsString1.html`
const CONTAINS_STRING_2 = `${TEST_DATA_PATH}activity-containsString2.html`
const CONTAINS_STRINGS = `${TEST_DATA_PATH}activity-containsStrings.html`
const IMAGES_UNLIKED = `${TEST_DATA_PATH}activity-imagesUnliked.html`;
const VIDEOS_UNCOMMENTED = `${TEST_DATA_PATH}activity-videosUncommented.html`;
const GIF = `${TEST_DATA_PATH}activity-gif.html`;

describe('ActivityHandler', () => {
    let activityHandler;

    beforeEach(function() {
        const config = {
            remove:
                { uncommented: false, unliked: false, text: false, images: false, gifs: false, videos: false, containsStrings: [] },
            options:
                { targetLoadCount: 2, caseSensitive: false, linkedConditions: [], reversedConditions: false },
        };

        activityHandler = new ActivityHandler(config);
    });

    afterEach(function() {
        restore();
    });

    function runTestCases(testCases) {
        testCases.forEach((testCase) => {
            const { htmlPath, configOptions, expectedRemove } = testCase;
            const nodeType = htmlPath.split('-')[1].split('.')[0];

            it(`should ${expectedRemove ? '' : 'not '}remove ${nodeType} node with config: ${JSON.stringify(configOptions)}`,
                function(done) {
                    fs.readFile(htmlPath, 'utf8',
                        function(err, htmlContent) {
                            if (err) throw err;

                            merge(activityHandler.config, configOptions);
                            const dom = new jsdom.JSDOM(htmlContent);
                            const node = dom.window.document.body.firstChild;
                            const removeSpy = spy(node, 'remove');
                            activityHandler.processActivityNode(node);

                            expect(removeSpy.calledOnce).to.equal(expectedRemove);
                            done();
                        });
                });
        });
    }

    // noinspection JSUnusedLocalSymbols
    function logTestCases(testCases) {
        testCases.forEach((testCase) => {
            const { htmlPath, configOptions, expectedRemove } = testCase;
            const nodeType = htmlPath.split('-')[1].split('.')[0];
            const testMessage = `should ${expectedRemove ? '' : 'not '}remove ${nodeType} node with config: ${JSON.stringify(configOptions)}`;

            it(testMessage, function(done) {
                fs.readFile(htmlPath, 'utf8', function(err, htmlContent) {
                    if (err) throw err;

                    merge(activityHandler.config, configOptions);
                    const dom = new jsdom.JSDOM(htmlContent);
                    const node = dom.window.document.body.firstChild;
                    const removeSpy = spy(node, 'remove');
                    activityHandler.processActivityNode(node);

                    if (removeSpy.calledOnce !== expectedRemove) {
                        fs.appendFile(path.join(__dirname, 'failedAssertions.txt'), `${testMessage},\n`, (err) => {
                            if (err) throw err;
                            done();
                        });
                    } else {
                        done();
                    }
                });
            });
        });
    }

    const STRING_1 = 'string1';
    const STRING_1_CAP = 'String1';
    const STRING_2 = 'string2';

    const testCases = [
        // Tests for unliked
        { htmlPath: UNLIKED, configOptions: { remove: { unliked: true } }, expectedRemove: true },
        { htmlPath: UNCOMMENTED, configOptions: { remove: { unliked: true } }, expectedRemove: false },
        { htmlPath: TEXT, configOptions: { remove: { unliked: true } }, expectedRemove: false },
        { htmlPath: MESSAGE, configOptions: { remove: { unliked: true } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { remove: { unliked: true } }, expectedRemove: false },
        { htmlPath: VIDEOS, configOptions: { remove: { unliked: true } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { unliked: true } }, expectedRemove: false },
        { htmlPath: IMAGES_UNLIKED, configOptions: { remove: { unliked: true } }, expectedRemove: true },

        // Tests for uncommented
        { htmlPath: UNLIKED, configOptions: { remove: { uncommented: true } }, expectedRemove: false },
        { htmlPath: UNCOMMENTED, configOptions: { remove: { uncommented: true } }, expectedRemove: true },
        { htmlPath: TEXT, configOptions: { remove: { uncommented: true } }, expectedRemove: false },
        { htmlPath: MESSAGE, configOptions: { remove: { uncommented: true } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { remove: { uncommented: true } }, expectedRemove: false },
        { htmlPath: VIDEOS, configOptions: { remove: { uncommented: true } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { uncommented: true } }, expectedRemove: false },
        { htmlPath: IMAGES_UNLIKED, configOptions: { remove: { uncommented: true } }, expectedRemove: false },

        // Tests for text
        { htmlPath: UNLIKED, configOptions: { remove: { text: true } }, expectedRemove: false },
        { htmlPath: UNCOMMENTED, configOptions: { remove: { text: true } }, expectedRemove: false },
        { htmlPath: TEXT, configOptions: { remove: { text: true } }, expectedRemove: true },
        { htmlPath: MESSAGE, configOptions: { remove: { text: true } }, expectedRemove: true },
        { htmlPath: IMAGES, configOptions: { remove: { text: true } }, expectedRemove: false },
        { htmlPath: VIDEOS, configOptions: { remove: { text: true } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { text: true } }, expectedRemove: false },
        { htmlPath: IMAGES_UNLIKED, configOptions: { remove: { text: true } }, expectedRemove: false },
        { htmlPath: GIF, configOptions: { remove: { text: true } }, expectedRemove: false },

        // Tests for images
        { htmlPath: UNLIKED, configOptions: { remove: { images: true } }, expectedRemove: false },
        { htmlPath: UNCOMMENTED, configOptions: { remove: { images: true } }, expectedRemove: false },
        { htmlPath: TEXT, configOptions: { remove: { images: true } }, expectedRemove: false },
        { htmlPath: MESSAGE, configOptions: { remove: { images: true } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { remove: { images: true } }, expectedRemove: true },
        { htmlPath: VIDEOS, configOptions: { remove: { images: true } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { images: true } }, expectedRemove: false },
        { htmlPath: IMAGES_UNLIKED, configOptions: { remove: { images: true } }, expectedRemove: true },
        { htmlPath: GIF, configOptions: { remove: { images: true } }, expectedRemove: false },

        // Tests for gifs
        { htmlPath: GIF, configOptions: { remove: { gifs: true } }, expectedRemove: true },

        // Tests for videos
        { htmlPath: UNLIKED, configOptions: { remove: { videos: true } }, expectedRemove: false },
        { htmlPath: UNCOMMENTED, configOptions: { remove: { videos: true } }, expectedRemove: false },
        { htmlPath: TEXT, configOptions: { remove: { videos: true } }, expectedRemove: false },
        { htmlPath: MESSAGE, configOptions: { remove: { videos: true } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { remove: { videos: true } }, expectedRemove: false },
        { htmlPath: VIDEOS, configOptions: { remove: { videos: true } }, expectedRemove: true },
        { htmlPath: VIDEOS_YOUTUBE, configOptions: { remove: { videos: true } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { videos: true } }, expectedRemove: false },
        { htmlPath: IMAGES_UNLIKED, configOptions: { remove: { videos: true } }, expectedRemove: false },

        // Tests for containsStrings
        { htmlPath: UNLIKED, configOptions: { remove: { containsStrings: [STRING_1] } }, expectedRemove: false },
        { htmlPath: UNCOMMENTED, configOptions: { remove: { containsStrings: [STRING_1] } }, expectedRemove: false },
        { htmlPath: TEXT, configOptions: { remove: { containsStrings: [STRING_1] } }, expectedRemove: false },
        { htmlPath: MESSAGE, configOptions: { remove: { containsStrings: [STRING_1] } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { remove: { containsStrings: [STRING_1] } }, expectedRemove: false },
        { htmlPath: VIDEOS, configOptions: { remove: { containsStrings: [STRING_1] } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [STRING_1] } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [STRING_1] }, options: { caseSensitive: true } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [STRING_1_CAP] }, options: { caseSensitive: true } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [[STRING_1]] } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [] } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [[]] } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [[STRING_1, STRING_2]] } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [[STRING_1], [STRING_2]] } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [[STRING_1, STRING_2], [STRING_2]] } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRINGS, configOptions: { remove: { containsStrings: [[STRING_1, STRING_2], [STRING_2]] } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [[STRING_2], [STRING_1, STRING_2]] } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_2, configOptions: { remove: { containsStrings: [STRING_1] } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRINGS, configOptions: { remove: { containsStrings: [STRING_1] } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRINGS, configOptions: { remove: { containsStrings: [[STRING_1, STRING_2]] } }, expectedRemove: true },
        { htmlPath: IMAGES_UNLIKED, configOptions: { remove: { containsStrings: [STRING_1] } }, expectedRemove: false },

        // Tests for linkedConditions
        { htmlPath: UNLIKED, configOptions: { options: { linkedConditions: [[]] } }, expectedRemove: false },
        { htmlPath: UNLIKED, configOptions: { options: { linkedConditions: [['images', 'unliked']] } }, expectedRemove: false },
        { htmlPath: UNCOMMENTED, configOptions: { options: { linkedConditions: [['images', 'unliked']] } }, expectedRemove: false },
        { htmlPath: TEXT, configOptions: { options: { linkedConditions: [['images', 'unliked']] } }, expectedRemove: false },
        { htmlPath: MESSAGE, configOptions: { options: { linkedConditions: [['images', 'unliked']] } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { options: { linkedConditions: [['images', 'unliked']] } }, expectedRemove: false },
        { htmlPath: VIDEOS, configOptions: { options: { linkedConditions: [['images', 'unliked']] } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { options: { linkedConditions: [['images', 'unliked']] } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { options: { linkedConditions: ['images', 'unliked'] } }, expectedRemove: false },
        { htmlPath: IMAGES_UNLIKED, configOptions: { options: { linkedConditions: [['images', 'unliked']] } }, expectedRemove: true },
        { htmlPath: IMAGES_UNLIKED, configOptions: { options: { linkedConditions: ['images', 'unliked'] } }, expectedRemove: true },
        { htmlPath: IMAGES_UNLIKED, configOptions: { options: { linkedConditions: [['videos', 'uncommented'], ['images', 'unliked']] } }, expectedRemove: true },
        { htmlPath: IMAGES, configOptions: { options: { linkedConditions: [['videos', 'uncommented'], ['images', 'unliked']] } }, expectedRemove: false },
        { htmlPath: VIDEOS_UNCOMMENTED, configOptions: { options: { linkedConditions: [['videos', 'uncommented']] } }, expectedRemove: true },
        { htmlPath: VIDEOS_UNCOMMENTED, configOptions: { options: { linkedConditions: [['videos', 'images']] } }, expectedRemove: false },
        { htmlPath: VIDEOS_UNCOMMENTED, configOptions: { options: { linkedConditions: [['videos', 'images'], ['videos']] } }, expectedRemove: true },
        { htmlPath: IMAGES, configOptions: { remove: { images: true }, options: { linkedConditions: [['images', 'unliked']] } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { remove: { images: true }, options: { linkedConditions: ['images', 'unliked'] } }, expectedRemove: false },
        { htmlPath: IMAGES_UNLIKED, configOptions: { options: { linkedConditions: ['videos', ['images', 'unliked']] } }, expectedRemove: true },
        { htmlPath: VIDEOS, configOptions: { options: { linkedConditions: [['images', 'unliked'], 'videos'] } }, expectedRemove: true },
        { htmlPath: IMAGES, configOptions: { options: { linkedConditions: [['images', 'unliked'], 'videos'] } }, expectedRemove: false },

        // Reversed conditions
        // Tests for reversed uncommented
        { htmlPath: UNLIKED, configOptions: { remove: { uncommented: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: UNCOMMENTED, configOptions: { remove: { uncommented: true }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: TEXT, configOptions: { remove: { uncommented: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: MESSAGE, configOptions: { remove: { uncommented: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES, configOptions: { remove: { uncommented: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: VIDEOS, configOptions: { remove: { uncommented: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { uncommented: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES_UNLIKED, configOptions: { remove: { uncommented: true }, options: { reverseConditions: true } }, expectedRemove: true },

        // Tests for reversed unliked
        { htmlPath: UNLIKED, configOptions: { remove: { unliked: true }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: UNCOMMENTED, configOptions: { remove: { unliked: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: TEXT, configOptions: { remove: { unliked: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: MESSAGE, configOptions: { remove: { unliked: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES, configOptions: { remove: { unliked: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: VIDEOS, configOptions: { remove: { unliked: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { unliked: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES_UNLIKED, configOptions: { remove: { unliked: true }, options: { reverseConditions: true } }, expectedRemove: false },

        // Tests for reversed images
        { htmlPath: UNLIKED, configOptions: { remove: { images: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: UNCOMMENTED, configOptions: { remove: { images: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: TEXT, configOptions: { remove: { images: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: MESSAGE, configOptions: { remove: { images: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES, configOptions: { remove: { images: true }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: VIDEOS, configOptions: { remove: { images: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { images: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES_UNLIKED, configOptions: { remove: { images: true }, options: { reverseConditions: true } }, expectedRemove: false },

        // Tests for reversed gifs
        { htmlPath: GIF, configOptions: { remove: { gifs: true }, options: { reverseConditions: true } }, expectedRemove: false },

        // Tests for reversed videos
        { htmlPath: UNLIKED, configOptions: { remove: { videos: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: UNCOMMENTED, configOptions: { remove: { videos: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: TEXT, configOptions: { remove: { videos: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: MESSAGE, configOptions: { remove: { videos: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES, configOptions: { remove: { videos: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: VIDEOS, configOptions: { remove: { videos: true }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: VIDEOS_YOUTUBE, configOptions: { remove: { videos: true }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { videos: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES_UNLIKED, configOptions: { remove: { videos: true }, options: { reverseConditions: true } }, expectedRemove: true },

        // Tests for reversed containsStrings
        { htmlPath: UNLIKED, configOptions: { remove: { containsStrings: [STRING_1] }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: UNCOMMENTED, configOptions: { remove: { containsStrings: [STRING_1] }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: TEXT, configOptions: { remove: { containsStrings: [STRING_1] }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: MESSAGE, configOptions: { remove: { containsStrings: [STRING_1] }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES, configOptions: { remove: { containsStrings: [STRING_1] }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: VIDEOS, configOptions: { remove: { containsStrings: [STRING_1] }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [STRING_1] }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [STRING_1] }, options: { caseSensitive: true, reverseConditions: true } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [STRING_1_CAP] }, options: { caseSensitive: true, reverseConditions: true } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_2, configOptions: { remove: { containsStrings: [STRING_1] }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_2, configOptions: { remove: { containsStrings: [[STRING_1]] }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_2, configOptions: { remove: { containsStrings: [] }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_2, configOptions: { remove: { containsStrings: [[]] }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_2, configOptions: { remove: { containsStrings: [[STRING_1, STRING_2]] }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_2, configOptions: { remove: { containsStrings: [[STRING_1], [STRING_2]] }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_2, configOptions: { remove: { containsStrings: [[STRING_1, STRING_2], [STRING_1]] }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRINGS, configOptions: { remove: { containsStrings: [STRING_1] }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRINGS, configOptions: { remove: { containsStrings: [[STRING_1, STRING_2]] }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: IMAGES_UNLIKED, configOptions: { remove: { containsStrings: [STRING_1] }, options: { reverseConditions: true } }, expectedRemove: true },

        // Tests for reversed linkedConditions
        { htmlPath: UNLIKED, configOptions: { options: { linkedConditions: [['images', 'unliked']], reverseConditions: true } }, expectedRemove: true },
        { htmlPath: TEXT, configOptions: { options: { linkedConditions: [['images', 'unliked']], reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES, configOptions: { options: { linkedConditions: [['images', 'unliked']], reverseConditions: true } }, expectedRemove: true },
        { htmlPath: VIDEOS, configOptions: { options: { linkedConditions: [['images', 'unliked']], reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES, configOptions: { options: { linkedConditions: [['images', 'unliked']], reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES, configOptions: { options: { linkedConditions: [['images', 'unliked']], reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES_UNLIKED, configOptions: { options: { linkedConditions: [['images', 'unliked']], reverseConditions: true } }, expectedRemove: false },
        { htmlPath: IMAGES_UNLIKED, configOptions: { options: { linkedConditions: ['images', 'unliked'], reverseConditions: true } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { options: { linkedConditions: ['images', 'unliked'], reverseConditions: true } }, expectedRemove: true },
        { htmlPath: VIDEOS_UNCOMMENTED, configOptions: { options: { linkedConditions: [['videos', 'uncommented']], reverseConditions: true } }, expectedRemove: false },
        { htmlPath: VIDEOS_UNCOMMENTED, configOptions: { options: { linkedConditions: [['videos', 'images']], reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES_UNLIKED, configOptions: { options: { linkedConditions: [['videos', 'uncommented'], ['images', 'unliked']], reverseConditions: true } }, expectedRemove: false },
        { htmlPath: IMAGES_UNLIKED, configOptions: { options: { linkedConditions: [['images', 'unliked'], ['videos', 'uncommented']], reverseConditions: true } }, expectedRemove: false },
        { htmlPath: IMAGES_UNLIKED, configOptions: { options: { linkedConditions: [['videos', 'uncommented'], ['images']], reverseConditions: true } }, expectedRemove: false },
        { htmlPath: IMAGES_UNLIKED, configOptions: { options: { linkedConditions: ['videos', ['images', 'unliked']], reverseConditions: true } }, expectedRemove: false },
        { htmlPath: VIDEOS, configOptions: { options: { linkedConditions: [['images', 'unliked'], 'videos'], reverseConditions: true } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { options: { linkedConditions: [['images', 'unliked'], 'videos'], reverseConditions: true } }, expectedRemove: true },
        { htmlPath: VIDEOS, configOptions: { remove: { uncommented: true }, options: { linkedConditions: ['videos', ['images', 'unliked']], reverseConditions: true } }, expectedRemove: false },
        { htmlPath: IMAGES_UNLIKED, configOptions: { remove: { uncommented: true }, options: { linkedConditions: ['videos', ['images', 'unliked']], reverseConditions: true } }, expectedRemove: false },
        { htmlPath: UNCOMMENTED, configOptions: { remove: { uncommented: true }, options: { linkedConditions: ['videos', ['images', 'unliked']], reverseConditions: true } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { remove: { images: true }, options: { linkedConditions: ['images', 'videos'], reverseConditions: true } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { containsStrings: [STRING_1] }, options: { linkedConditions: ['images', 'containsStrings'], reverseConditions: true } }, expectedRemove: true },

        // Tests for reversed text
        { htmlPath: UNLIKED, configOptions: { remove: { text: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: UNCOMMENTED, configOptions: { remove: { text: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: TEXT, configOptions: { remove: { text: true }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: MESSAGE, configOptions: { remove: { text: true }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { remove: { text: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: VIDEOS, configOptions: { remove: { text: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { text: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: IMAGES_UNLIKED, configOptions: { remove: { text: true }, options: { reverseConditions: true } }, expectedRemove: true },

        // Tests for multiple unlinked reversed conditions
        { htmlPath: UNLIKED, configOptions: { remove: { images: true, videos: true }, options: { reverseConditions: true } }, expectedRemove: true },
        { htmlPath: VIDEOS, configOptions: { remove: { images: true, videos: true }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: CONTAINS_STRING_1, configOptions: { remove: { images: true, containsStrings: ['String1'] }, options: { reverseConditions: true } }, expectedRemove: false },
        { htmlPath: IMAGES, configOptions: { remove: { images: true, videos: true }, options: { reverseConditions: true } }, expectedRemove: false },
    ];

    // logTestCases(testCases)
    runTestCases(testCases);
});