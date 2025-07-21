const MainApp = require("../src/activityFeedFilter.user").MainApp;
const sinon = require('sinon');
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');

const jsdom = new JSDOM('<!doctype html><html lang="en"><body></body></html>');
global.window = jsdom.window;
global.document = jsdom.window.document;
global.HTMLElement = jsdom.window.HTMLElement;

describe('MainApp', () => {
    let mainApp;
    let activityHandler;
    let uiHandler;

    beforeEach(() => {
        activityHandler = {
            processActivityNode: sinon.spy(),
            _resetLoadCount: sinon.spy(),
            currentLoadCount: 0,
        };

        uiHandler = {
            bindLoadMoreButton: sinon.spy(),
            triggerLoadMore: sinon.spy(),
            userPressed: true,
            resetUIState: sinon.spy(),
        };

        mainApp = new MainApp(activityHandler, uiHandler, {
            options: {
                targetLoadCount: 10,
            },
            runOn: {
                home: false,
                social: false,
                profile: false,
                guestHome: false,
            },
        });
    });

    describe('observeMutations', () => {
        it('should call handleAddedNode and _processLoadOrReset if URL is allowed', () => {
            const mutations = [{ addedNodes: [document.createElement('div')] }];
            const isAllowedUrlStub = sinon.stub(mainApp, '_isUrlAllowed').returns(true);
            const handleAddedNodeSpy = sinon.spy(mainApp, '_handleAddedNode');
            const loadMoreOrResetSpy = sinon.spy(mainApp, '_processLoadOrReset');

            mainApp._observeMutations(mutations);

            expect(isAllowedUrlStub.calledOnce).to.be.true;
            expect(handleAddedNodeSpy.calledOnce).to.be.true;
            expect(loadMoreOrResetSpy.calledOnce).to.be.true;

            isAllowedUrlStub.restore();
            handleAddedNodeSpy.restore();
            loadMoreOrResetSpy.restore();
        });

        it('should not call handleAddedNode and _processLoadOrReset if URL is not allowed', () => {
            const mutations = [{ addedNodes: [document.createElement('div')] }];
            const isAllowedUrlStub = sinon.stub(mainApp, '_isUrlAllowed').returns(false);
            const handleAddedNodeSpy = sinon.spy(mainApp, '_handleAddedNode');
            const loadMoreOrResetSpy = sinon.spy(mainApp, '_processLoadOrReset');

            mainApp._observeMutations(mutations);

            expect(isAllowedUrlStub.calledOnce).to.be.true;
            expect(handleAddedNodeSpy.called).to.be.false;
            expect(loadMoreOrResetSpy.called).to.be.false;

            isAllowedUrlStub.restore();
            handleAddedNodeSpy.restore();
            loadMoreOrResetSpy.restore();
        });
    });

    describe('handleAddedNode', () => {
        it('should call ac.processActivityNode when an activity node is added', () => {
            const activityNode = document.createElement('div');
            activityNode.classList.add('activity-entry');

            mainApp._handleAddedNode(activityNode);

            expect(activityHandler.processActivityNode.calledOnce).to.be.true;
        });

        it('should call ui.bindLoadMoreButton when a button node is added', () => {
            const buttonNode = document.createElement('div');
            buttonNode.classList.add('load-more');

            mainApp._handleAddedNode(buttonNode);

            expect(uiHandler.bindLoadMoreButton.calledOnce).to.be.true;
        });

        it('should not call ac.processActivityNode or ui.bindLoadMoreButton for other node types', () => {
            const otherNode = document.createElement('div');

            mainApp._handleAddedNode(otherNode);

            expect(activityHandler.processActivityNode.called).to.be.false;
            expect(uiHandler.bindLoadMoreButton.called).to.be.false;
        });

        it('should process an activity entry when its markdown sub-node is added', () => {
            const entry = document.createElement('div');
            entry.classList.add('activity-entry');
            document.body.appendChild(entry);
            const markdown = document.createElement('div');
            markdown.classList.add('markdown');
            entry.appendChild(markdown);

            mainApp._handleAddedNode(markdown);

            expect(activityHandler.processActivityNode.calledOnce).to.be.true;
            expect(activityHandler.processActivityNode.calledWith(entry)).to.be.true;
        });

        it('should ignore non-HTMLElement nodes and not throw', () => {
            const textNode = document.createTextNode('just text');
            expect(() => mainApp._handleAddedNode(textNode)).to.not.throw();
        });
    });

    describe('_processLoadOrReset', () => {
        it('should call ui.triggerLoadMore if currentLoadCount < targetLoadCount and userPressed is true', () => {
            activityHandler.currentLoadCount = 5;
            uiHandler.userPressed = true;

            mainApp._processLoadOrReset();

            expect(uiHandler.triggerLoadMore.calledOnce).to.be.true;
        });

        it('should call ac.__resetLoadCount and ui.__resetLoadCount if currentLoadCount is equal to targetLoadCount and userPressed is true', () => {
            activityHandler.currentLoadCount = 10;
            uiHandler.userPressed = true;

            mainApp._processLoadOrReset();

            expect(activityHandler._resetLoadCount.calledOnce).to.be.true;
            expect(uiHandler.resetUIState.calledOnce).to.be.true;
        });

        it('should call ac.__resetLoadCount and ui.__resetLoadCount if currentLoadCount >= config.targetLoadCount or userPressed is false', () => {
            activityHandler.currentLoadCount = 10;
            uiHandler.userPressed = false;

            mainApp._processLoadOrReset();

            expect(activityHandler._resetLoadCount.calledOnce).to.be.true;
            expect(uiHandler.resetUIState.calledOnce).to.be.true;
        });
    });

    describe('_isUrlAllowed', () => {
        const testUrls = [
            'https://anilist.co/home',
            'https://anilist.co/user/username/',
            'https://anilist.co/anime/social',
            'https://anilist.co/social',
        ];

        it('should return false for all URLs when all config values are false', () => {
            Object.keys(mainApp.config.runOn).forEach(key => {
                mainApp.config.runOn[key] = false;
            });

            testUrls.forEach(url => {
                global.window = { location: { href: url } };
                expect(mainApp._isUrlAllowed()).to.be.false;
            });
        });

        it('should return true for corresponding URLs when all config values are true', () => {
            Object.keys(mainApp.config.runOn).forEach(key => {
                mainApp.config.runOn[key] = true;
            });

            testUrls.forEach(url => {
                global.window = { location: { href: url } };
                expect(mainApp._isUrlAllowed()).to.be.true;
            });
        });
    });
});
