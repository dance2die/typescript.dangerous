import * as React from "react";
import { isValidElementType } from "react-is";
import domElements from "./domElements";
import hoistNonReactStatic from "hoist-non-react-statics";

import { Target } from "./types";

// https://github.com/styled-components/styled-components/blob/master/src/utils/isTag.js
function isTag(target: Target): boolean {
  return (
    typeof target === "string" &&
    (process.env.NODE_ENV !== "production"
      ? target.charAt(0) === target.charAt(0).toLowerCase()
      : true)
  );
}

interface DangerousComponentProps {
  as: Target;
  forwardedRef: React.RefObject<Target>;
}

type TextBuilder = {
  (string, number): string;
};

function DangerousComponent(props): React.ComponentType {
  const { as: WrappedComponent, args, forwardedRef } = props;
  const [texts, ...callbacks] = args;

  const toLines: TextBuilder = (text: string, i: number) =>
    `${text}${args[i + 1] ? callbacks[i](props) : ""}`;
  const toHtml: TextBuilder = (unsafeText: string, line: string) =>
    (unsafeText += line);

  const __html: string = texts.map(toLines).reduce(toHtml, "");

  return (
    <WrappedComponent ref={forwardedRef} dangerouslySetInnerHTML={{ __html }} />
  );
}

function contructWithArgs(tag: Target, args): React.ComponentType {
  if (!isValidElementType(tag))
    throw new Error(`${tag} is not a valid React element`);

  const WrappedComponent = React.forwardRef((props, ref) => (
    <DangerousComponent as={tag} args={args} forwardedRef={ref} {...props} />
  ));

  WrappedComponent.displayName = `ContructWithArgs(${getDisplayName(tag)})`;

  hoistNonReactStatic(WrappedComponent, tag);

  return WrappedComponent;
}

function getDisplayName(WrappedComponent): string {
  if (isTag(WrappedComponent)) return `dangerous.${WrappedComponent}`;

  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}

type Args = string | Function;

const dangerous = (tag: Target) => (...args) => contructWithArgs(tag, args);

// Shorthands for all valid HTML Elements
domElements.forEach((domElement: string) => {
  dangerous[domElement] = dangerous(domElement);
});

export default dangerous;
