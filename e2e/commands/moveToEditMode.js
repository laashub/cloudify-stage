/**
 * Created by pawelposel on 2017-05-31.
 */

exports.command = function() {
    var section = this.page.page().section.userMenu;

    return section.click('@userName')
        .waitForElementVisible('@userDropdownMenu')
        .getText('@editModeMenuItem', result => {
            if (result.value === section.props.editModeLabel) {
                section.click('@editModeMenuItem');
            }
        });
};