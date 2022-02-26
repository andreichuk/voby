
/* IMPORT */

import type {Child, ComponentIntrinsicElement, ComponentNode, Component, Props} from './types';
import BaseComponent from './components/component';
import {isFunction, isNil, isNode, isString} from './utils/lang';
import {setProps, setRef} from './utils/setters';

/* MAIN */

// It's important to wrap components, so that they can be executed in the right order, from parent to child, rather than from child to parent in some cases

function createElement <T extends ComponentIntrinsicElement> ( component: T, props: Props | null, ..._children: Child[] ): (() => JSX.IntrinsicElementsMap[T]);
function createElement <T extends ComponentNode> ( component: T | (() => T), props: Props | null, ..._children: Child[] ): (() => T);
function createElement ( component: Component, props: Props | null, ..._children: Child[] ): (() => Child);
function createElement ( component: Component, props: Props | null, ..._children: Child[] ): (() => Child) {

  const { children: __children, key, ref, ...rest } = props || {};
  const children = ( _children.length === 1 ) ? _children[0] : ( _children.length === 0 ) ? __children : _children;

  if ( !isNil ( rest.className ) && isString ( rest.class ) ) {

    throw new Error ( 'Invalid class prop, it can only be null, undefined or an object when className is provided too' );

  }

  if ( isFunction ( component ) ) {

    if ( BaseComponent.isPrototypeOf ( component ) ) {

      const props = rest;

      if ( !isNil ( children ) ) props.children = children;

      return (): Child => {

        const instance = new component ( props );
        const child = instance.render ();

        if ( !isNil ( ref ) ) setRef ( instance, ref );

        return child;

      };

    } else {

      const props = rest;

      if ( !isNil ( children ) ) props.children = children;
      if ( !isNil ( ref ) ) props.ref = ref;

      return (): Child => {

        return component ( props );

      };

    }

  } else if ( isString ( component ) ) {

    const props = rest;

    if ( !isNil ( children ) ) props.children = children;
    if ( !isNil ( ref ) ) props.ref = ref;

    return (): Child => {

      const child = document.createElement ( component );

      setProps ( child, props );

      return child;

    };

  } else if ( isNode ( component ) ) {

    return (): Child => {

      return component;

    };

  } else {

    throw new Error ( 'Invalid component' );

  }

};

/* EXPORT */

export default createElement;
