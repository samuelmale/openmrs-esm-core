import React from "react";
import { always } from "kremling";
import {
  ToastNotification,
  InlineNotification,
  NotificationActionButton,
} from "carbon-components-react";

const defaultOptions = {
  millis: 4000,
};

export default function Toast({ toast, closeToastRef, isClosing }) {
  const { millis, description } = Object.assign({}, toast, defaultOptions);

  const [waitingForTime, setWaitingForTime] = React.useState(true);
  const [isMounting, setIsMounting] = React.useState(true);

  React.useEffect(() => {
    if (waitingForTime) {
      const timeoutId = setTimeout(() => {
        closeToastRef.current(toast);
      }, millis);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [waitingForTime]);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsMounting(false);
    }, 20);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      <InlineNotification
        kind="info"
        iconDescription="describes the close button"
        subtitle={
          <span>
            Subtitle text goes here. <a href="#example">Example link</a>
          </span>
        }
        title=""
      />
    </>
  );
}
