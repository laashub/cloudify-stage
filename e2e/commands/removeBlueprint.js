/**
 * Created by pawelposel on 2017-05-31.
 */

exports.command = function(blueprintName) {
    if (!blueprintName) {
        blueprintName = this.page.blueprints().props.testBlueprint;
    }

    var blueprintActionButtons = this.page.blueprintActionButtons();

    return this.isWidgetPresent(blueprintActionButtons.props.widgetId, result => {
            console.log("-- removing " + blueprintName + " blueprint");

            if (!result.value) {
                this.moveToEditMode()
                    .addWidget(blueprintActionButtons.props.widgetId)
                    .moveOutOfEditMode();
            }

            this.selectBlueprint(blueprintName);

            blueprintActionButtons.section.buttons
                .waitForElementNotPresent('@deleteButtonDisabled')
                .click('@deleteBlueprintButton');

            blueprintActionButtons.section.removeConfirm
                .waitForElementVisible('@okButton')
                .click('@okButton')
                .waitForElementNotPresent('@okButton');

            this.page.filter()
                .waitForBlueprintNotPresent(blueprintName);
        });
};