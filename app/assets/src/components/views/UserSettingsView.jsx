import React from "react";
import { set } from "lodash/fp";

import { ViewHeader, NarrowContainer } from "~/components/layout";
import { getUserSettingMetadataByCategory, updateUserSetting } from "~/api";
import LoadingMessage from "~/components/common/LoadingMessage";
import Checkbox from "~ui/controls/Checkbox";
import { UserContext } from "~/components/common/UserContext";

import cs from "./user_settings_view.scss";

export default class UserSettingsView extends React.Component {
  state = {
    userPreferenceMetadata: null,
    isLoading: true,
    // User setting values that were modified on this page and not reflected in the UserContext.
    modifiedUserSettings: {},
    error: "",
  };

  async componentDidMount() {
    try {
      const userPreferenceMetadata = await getUserSettingMetadataByCategory();

      this.setState({
        isLoading: false,
        userPreferenceMetadata,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e.error);
      // Show an error if the update fails.
      this.setState({
        isLoading: false,
        error: "Could not fetch user settings. Please try again later.",
      });
    }
  }

  getUserPreferenceValues = () => {
    const { userSettings } = this.context || {};

    return {
      ...userSettings,
      ...this.state.modifiedUserSettings,
    };
  };

  handleUserPreferenceUpdate = async (key, value) => {
    // Modify the value on the front-end, so that the user gets instant feedback.
    this.setState({
      modifiedUserSettings: set(key, value, this.state.modifiedUserSettings),
    });

    try {
      await updateUserSetting(key, value);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e.error);
      // Show an error if the update fails.
      this.setState({
        error: "We were unable to save your settings",
      });
    }
  };

  renderUserPreferenceField = field => {
    const currentValue = this.getUserPreferenceValues()[field.key];
    if (field.data_type === "boolean") {
      return (
        <div className={cs.field}>
          <Checkbox
            label={field.description}
            onChange={(_, isChecked) =>
              this.handleUserPreferenceUpdate(field.key, isChecked)
            }
            checked={currentValue}
          />
        </div>
      );
    }

    return null;
  };

  renderCategory = category => {
    return (
      <div className={cs.category}>
        <div className={cs.title}>{category.name}</div>
        <div className={cs.fields}>
          {category.settings.map(this.renderUserPreferenceField)}
        </div>
      </div>
    );
  };

  renderCategories = () => {
    const { error, userPreferenceMetadata } = this.state;

    if (userPreferenceMetadata && userPreferenceMetadata.length === 0) {
      return <div className={cs.noResultsMessage}>No user settings found</div>;
    }

    return (
      <div>
        {error && <div className={cs.error}>{error}</div>}
        {userPreferenceMetadata &&
          userPreferenceMetadata.map(category => this.renderCategory(category))}
      </div>
    );
  };

  renderLoading = () => {
    return <LoadingMessage message="Loading Settings..." />;
  };

  render() {
    const { isLoading } = this.state;

    return (
      <div>
        <NarrowContainer>
          <ViewHeader className={cs.viewHeader}>
            <ViewHeader.Content>
              <ViewHeader.Title label={"User Settings"} />
            </ViewHeader.Content>
          </ViewHeader>
          {isLoading ? this.renderLoading() : this.renderCategories()}
        </NarrowContainer>
      </div>
    );
  }
}

UserSettingsView.contextType = UserContext;
