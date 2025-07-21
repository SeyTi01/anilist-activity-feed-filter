const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;
const { UIHandler } = require('../src/activityFeedFilter.user');
const { JSDOM } = require('jsdom');
const { restore } = require('sinon');

const jsdom = new JSDOM('<!doctype html><html lang="en"><body></body></html>');
global.window = jsdom.window;
global.document = jsdom.window.document;
global.HTMLElement = jsdom.window.HTMLElement;

describe('UIHandler', () => {
    let uiHandler;

    beforeEach(() => {
        uiHandler = new UIHandler();
    });

    afterEach(() => {
        restore();
    });

    it('should set loadMore button and handle click', () => {
        const loadMoreButton = document.createElement('button');
        uiHandler.bindLoadMoreButton(loadMoreButton);

        expect(uiHandler.loadMoreButton).to.equal(loadMoreButton);

        const simulateDomEventsSpy = sinon.spy(uiHandler, '_startScrollTrigger');
        const showCancelSpy = sinon.spy(uiHandler, '_showCancelButton');

        uiHandler.triggerLoadMore();

        expect(simulateDomEventsSpy.calledOnce).to.be.true;
        expect(showCancelSpy.calledOnce).to.be.true;

        simulateDomEventsSpy.restore();
        showCancelSpy.restore();
    });

    it('should reset the state', () => {
        uiHandler.userPressed = true;
        uiHandler.resetUIState();

        expect(uiHandler.userPressed).to.be.false;
    });

    it('should show an error message that disappears after 5 seconds', () => {
        const clock = sinon.useFakeTimers();

        expect(document.querySelector('.config-error-message')).to.be.null;

        uiHandler.displayErrorMessage('Test error');
        const errorDiv = document.querySelector('.config-error-message');

        expect(errorDiv).to.exist;
        expect(errorDiv.textContent).to.equal('Test error');
        expect(errorDiv.style.display).to.not.equal('none');

        clock.tick(5000);

        expect(errorDiv.style.display).to.equal('none');

        clock.restore();
    });
});
