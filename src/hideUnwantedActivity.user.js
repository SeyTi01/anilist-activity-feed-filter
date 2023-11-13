// ==UserScript==
// @name         Anilist: Hide Unwanted Activity
// @namespace    https://github.com/SeyTi01/
// @version      1.8b
// @description  Customize activity feeds by removing unwanted entries.
// @author       SeyTi01
// @match        https://anilist.co/*
// @grant        none
// @license      MIT
// ==/UserScript==

const config = {
    remove: {
        uncommented: true, // Remove activities that have no comments
        unliked: false, // Remove activities that have no likes
        text: false, // Remove activities containing only text
        images: false, // Remove activities containing images
        videos: false, // Remove activities containing videos
        containsStrings: [], // Remove activities containing user defined strings
    },
    options: {
        targetLoadCount: 2, // Minimum number of activities to show per click on the "Load More" button
        caseSensitive: false, // Whether string-based removal should be case-sensitive
        reversedConditions: false, // Only keep posts that would be removed by the conditions
        linkedConditions: [], // Groups of conditions to be checked together (linked conditions are always considered 'true')
    },
    runOn: {
        home: true, // Run the script on the home feed
        social: true, // Run the script on social feeds
        profile: false, // Run the script on user profile feeds
    },
};

class MainApp {
    constructor(activityHandler, uiHandler, config) {
        this.ac = activityHandler;
        this.ui = uiHandler;
        this.config = config;
    }

    observeMutations = (mutations) => {
        if (this.isAllowedUrl()) {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => this.handleAddedNode(node));
                }
            }

            this.loadMoreOrReset();
        }
    }

    handleAddedNode = (node) => {
        if (node instanceof HTMLElement) {
            if (node.matches(SELECTORS.div.activity)) {
                this.ac.removeEntry(node);
            } else if (node.matches(SELECTORS.div.button)) {
                this.ui.setLoadMore(node);
            }
        }
    }

    loadMoreOrReset = () => {
        if (this.ac.currentLoadCount < this.config.options.targetLoadCount && this.ui.userPressed) {
            this.ui.clickLoadMore();
        } else {
            this.ac.resetState();
            this.ui.resetState();
        }
    }

    isAllowedUrl = () => {
        const allowedPatterns = Object.keys(this.URLS).filter(pattern => this.config.runOn[pattern]);

        return allowedPatterns.some(pattern => {
            const regex = new RegExp(this.URLS[pattern].replace('*', '.*'));
            return regex.test(window.location.href);
        });
    }

    initializeObserver = () => {
        this.observer = new MutationObserver(this.observeMutations);
        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    URLS = {
        home: 'https://anilist.co/home',
        profile: 'https://anilist.co/user/*/',
        social: 'https://anilist.co/*/social',
    };
}

class ActivityHandler {
    constructor(config) {
        this.currentLoadCount = 0;
        this.config = config;
    }

    conditionsMap = new Map([
        ['uncommented', (node, reverse) => reverse ? !this.shouldRemoveUncommented(node) : this.shouldRemoveUncommented(node)],
        ['unliked', (node, reverse) => reverse ? !this.shouldRemoveUnliked(node) : this.shouldRemoveUnliked(node)],
        ['text', (node, reverse) => reverse ? !this.shouldRemoveText(node) : this.shouldRemoveText(node)],
        ['images', (node, reverse) => reverse ? !this.shouldRemoveImage(node) : this.shouldRemoveImage(node)],
        ['videos', (node, reverse) => reverse ? !this.shouldRemoveVideo(node) : this.shouldRemoveVideo(node)],
        ['containsStrings', (node, reverse) => this.shouldRemoveStrings(node, reverse)],
    ]);

    removeEntry = (node) => this.shouldRemoveNode(node) ? node.remove() : this.currentLoadCount++;

    resetState = () => this.currentLoadCount = 0;

    shouldRemoveNode = (node) => {
        const { remove, options: { linkedConditions, reversedConditions } } = this.config;

        const skipChecking = (condition) => linkedConditions?.flat()?.includes(condition);

        if (this.shouldRemoveByLinkedConditions(node)) {
            return true;
        }

        if (reversedConditions) {
            const toBeRemoved = Array.from(this.conditionsMap)
                .filter(([name]) => {
                    const conditionOption = remove[name];
                    return (conditionOption === true || (Array.isArray(conditionOption) && conditionOption.length > 0))
                        && !skipChecking(name);
                })
                .map(([, predicate]) => predicate(node, reversedConditions));

            return toBeRemoved.includes(true) && !toBeRemoved.includes(false);
        }

        return Array.from(this.conditionsMap).some(([name, predicate]) => {
            const conditionOption = remove[name];
            return (conditionOption === true || (Array.isArray(conditionOption) && conditionOption.length > 0))
                && !skipChecking(name) && predicate(node, reversedConditions);
        });
    }

    shouldRemoveByLinkedConditions = (node) => {
        const { options: { linkedConditions, reversedConditions } } = this.config;

        if (!linkedConditions || linkedConditions.length === 0) {
            return false;
        }

        const conditions = Array.isArray(linkedConditions[0]) ? linkedConditions : [linkedConditions];

        const checkConditions = (node, conditionList, reversedConditions) => {
            return reversedConditions
                ? conditionList.some(condition => this.conditionsMap.get(condition)(node, reversedConditions))
                : conditionList.every(condition => this.conditionsMap.get(condition)(node, reversedConditions));
        }

        return conditions.some(condition => checkConditions(node, condition, reversedConditions));
    }

    shouldRemoveStrings = (node, reversed) => {
        const { remove: { containsStrings } } = this.config;

        if (!containsStrings.flat().length) return false;

        const containsString = (nodeText, strings) => {
            const { options: { caseSensitive } } = this.config;
            return !caseSensitive
                ? nodeText.toLowerCase().includes(strings.toLowerCase())
                : nodeText.includes(strings);
        };

        const checkStrings = (strings) => Array.isArray(strings)
            ? strings.every(str => containsString(node.textContent, str))
            : containsString(node.textContent, strings);

        return reversed
            ? !containsStrings.some(checkStrings)
            : containsStrings.some(checkStrings);
    };

    shouldRemoveText = (node) =>
        (node.classList.contains(SELECTORS.activity.text) || node.classList.contains(SELECTORS.activity.message))
        && !(this.shouldRemoveImage(node) || this.shouldRemoveVideo(node));

    shouldRemoveVideo = (node) => node?.querySelector(SELECTORS.class.video)
        || node?.querySelector(SELECTORS.span.youTube);

    shouldRemoveUncommented = (node) => !node.querySelector(SELECTORS.div.replies)?.querySelector(SELECTORS.span.count);

    shouldRemoveUnliked = (node) => !node.querySelector(SELECTORS.div.likes)?.querySelector(SELECTORS.span.count);

    shouldRemoveImage = (node) => node?.querySelector(SELECTORS.class.image);
}

class UIHandler {
    constructor() {
        this.userPressed = true;
        this.cancel = null;
        this.loadMore = null;
    }

    setLoadMore = (button) => {
        this.loadMore = button;
        this.loadMore.addEventListener('click', () => {
            this.userPressed = true;
            this.simulateDomEvents();
            this.showCancel();
        });
    };

    clickLoadMore = () => {
        if (this.loadMore) {
            this.loadMore.click();
            this.loadMore = null;
        }
    };

    resetState = () => {
        this.userPressed = false;
        this.hideCancel();
    };

    showCancel = () => {
        if (!this.cancel) {
            this.createCancel();
        } else {
            this.cancel.style.display = 'block';
        }
    };

    hideCancel = () => {
        if (this.cancel) {
            this.cancel.style.display = 'none';
        }
    };

    simulateDomEvents = () => {
        const domEvent = new Event('scroll', { bubbles: true });
        const intervalId = setInterval(() => {
            if (this.userPressed) {
                window.dispatchEvent(domEvent);
            } else {
                clearInterval(intervalId);
            }
        }, 100);
    };

    createCancel = () => {
        const BUTTON_STYLE = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            z-index: 9999;
            line-height: 1.3;
            background-color: rgb(var(--color-background-blue-dark));
            color: rgb(var(--color-text-bright));
            font: 1.6rem 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            -webkit-font-smoothing: antialiased;
            box-sizing: border-box;
            --button-color: rgb(var(--color-blue));
            `;

        this.cancel = Object.assign(document.createElement('button'), {
            textContent: 'Cancel',
            className: 'cancel-button',
            style: BUTTON_STYLE,
            onclick: () => {
                this.userPressed = false;
                this.cancel.style.display = 'none';
            },
        });

        document.body.appendChild(this.cancel);
    };
}

class ConfigValidator {
    constructor(config) {
        this.config = config;
        this.errors = [];
    }

    validate() {
        this.validatePositiveNonZeroInteger('options.targetLoadCount', 'options.targetLoadCount');
        this.validateArrays(['remove.containsStrings', 'options.linkedConditions']);
        this.validateLinkedConditions('options.linkedConditions');
        this.validateStringArrays(['remove.containsStrings']);
        this.validateBooleans(['remove.uncommented', 'remove.unliked', 'remove.text', 'remove.images',
            'remove.videos', 'options.caseSensitive', 'runOn.home', 'runOn.social', 'runOn.profile']);

        if (this.errors.length > 0) {
            const errorMessage = `Script disabled due to configuration errors: ${this.errors.join(', ')}`;
            throw new Error(errorMessage);
        }
    }

    validateBooleans(keys) {
        for (const key of keys) {
            const value = this.getConfigValue(key);
            if (typeof value !== 'boolean') {
                this.errors.push(`${key} should be a boolean`);
            }
        }
    }

    validatePositiveNonZeroInteger(key, configKey) {
        const value = this.getConfigValue(configKey);
        if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
            this.errors.push(`${key} should be a positive non-zero integer`);
        }
    }

    validateArrays(keys) {
        for (const key of keys) {
            const value = this.getConfigValue(key);
            if (!Array.isArray(value)) {
                this.errors.push(`${key} should be an array`);
            }
        }
    }

    validateStringArrays(keys) {
        for (const key of keys) {
            const value = this.getConfigValue(key);
            if (!Array.isArray(value)) {
                this.errors.push(`${key} should be an array`);
            } else {
                if (!this.validateArrayContents(value)) {
                    this.errors.push(`${key} should only contain strings`);
                }
            }
        }
    }

    validateArrayContents(arr) {
        for (const element of arr) {
            if (Array.isArray(element)) {
                if (!this.validateArrayContents(element)) {
                    return false;
                }
            } else if (typeof element !== 'string') {
                return false;
            }
        }
        return true;
    }

    validateLinkedConditions(configKey) {
        const linkedConditions = this.getConfigValue(configKey);
        const allowedConditions = ['uncommented', 'unliked', 'text', 'images', 'videos', 'containsStrings'];

        for (const condition of linkedConditions.flat()) {
            if (typeof condition !== 'string' || !allowedConditions.includes(condition)) {
                this.errors.push(`${configKey} should only contain the following strings: ${allowedConditions.join(', ')}`);
                return;
            }
        }
    }

    getConfigValue(key) {
        const keys = key.split('.');
        let value = this.config;
        for (const k of keys) {
            value = value[k];
        }
        return value;
    }
}

const SELECTORS = {
    div: {
        button: 'div.load-more',
        activity: 'div.activity-entry',
        replies: 'div.action.replies',
        likes: 'div.action.likes',
    },
    span: {
        count: 'span.count',
        youTube: 'span.youtube',
    },
    activity: {
        text: 'activity-text',
        message: 'activity-message',
    },
    class: {
        image: 'img',
        video: 'video',
    },
};

function main() {
    try {
        new ConfigValidator(config).validate();
    } catch (error) {
        console.error(error.message);
        return;
    }

    const activityHandler = new ActivityHandler(config);
    const uiHandler = new UIHandler();
    const mainApp = new MainApp(activityHandler, uiHandler, config);

    mainApp.initializeObserver();
}

if (require.main === module) {
    main();
}

module.exports = { MainApp, ActivityHandler, UIHandler, ConfigValidator, SELECTORS };