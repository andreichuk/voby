
/* IMPORT */

import {SYMBOL_OBSERVABLE_FROZEN, SYMBOL_UNCACHED, SYMBOL_UNTRACKED_UNWRAPPED} from '~/constants';
import useReaction from '~/hooks/use_reaction';
import isObservable from '~/methods/is_observable';
import $$ from '~/methods/SS';
import {createText} from '~/utils/creators';
import {isArray, isFunction, isString, isVoidChild} from '~/utils/lang';
import type {Classes, ObservableMaybe} from '~/types';

/* MAIN */

const resolveChild = <T> ( value: ObservableMaybe<T>, setter: (( value: T | T[], dynamic: boolean ) => void), _dynamic: boolean = false ): void => {

  if ( isFunction ( value ) ) {

    if ( SYMBOL_UNTRACKED_UNWRAPPED in value || SYMBOL_OBSERVABLE_FROZEN in value ) {

      resolveChild ( value (), setter, _dynamic );

    } else {

      useReaction ( () => {

        resolveChild ( value (), setter, true );

      });

    }

  } else if ( isArray ( value ) ) {

    const [values, hasObservables] = resolveArraysAndStatics ( value );

    values[SYMBOL_UNCACHED] = value[SYMBOL_UNCACHED]; // Preserving this special symbol

    if ( hasObservables ) {

      useReaction ( () => {

        setter ( resolveResolved ( values, [] ), true );

      });

    } else {

      setter ( values, _dynamic );

    }

  } else {

    setter ( value, _dynamic );

  }

};

const resolveClass = ( classes: Classes, resolved: Record<string, true> = {} ): Record<string, true> => {

  if ( isString ( classes ) ) {

    classes.split ( /\s+/g ).filter ( Boolean ).filter ( cls => {

      resolved[cls] = true;

    });

  } else if ( isFunction ( classes ) ) {

    resolveClass ( classes (), resolved );

  } else if ( isArray ( classes ) ) {

    classes.forEach ( cls => {

      resolveClass ( cls as Classes, resolved ); //TSC

    });

  } else if ( classes ) {

    for ( const key in classes ) {

      const value = classes[key];
      const isActive = !!$$(value);

      if ( !isActive ) continue;

      resolved[key] = true;

    }

  }

  return resolved;

};

const resolveResolved = <T> ( value: T, values: any[] ): any => {

  while ( isObservable<T> ( value ) ) {

    value = value ();

  }

  if ( isArray ( value ) ) {

    for ( let i = 0, l = value.length; i < l; i++ ) {

      resolveResolved ( value[i], values );

    }

  } else if ( !isVoidChild ( value ) ) { // It's cheaper to discard void children here

    values.push ( value );

  }

  return values;

};

const resolveArraysAndStatics = (() => {

  // This function does 3 things:
  // 1. It deeply flattens the array, only if actually needed though (!)
  // 2. It resolves statics, it's important to resolve them soon enough or they will be re-created multiple times (!)
  // 3. It checks if we found any Observables along the way, avoiding looping over the array another time in the future

  const DUMMY_RESOLVED = [];

  const resolveArraysAndStaticsInner = ( values: any[], resolved: any[], hasObservables: boolean ): [any[], boolean] => {

    for ( let i = 0, l = values.length; i < l; i++ ) {

      const value = values[i];
      const type = typeof value;

      if ( type === 'string' || type === 'number' || type === 'bigint' ) { // Static

        if ( resolved === DUMMY_RESOLVED ) resolved = values.slice ( 0, i );

        resolved.push ( createText ( value ) );

      } else if ( type === 'object' && isArray ( value ) ) { // Array

        if ( resolved === DUMMY_RESOLVED ) resolved = values.slice ( 0, i );

        hasObservables = resolveArraysAndStaticsInner ( value, resolved, hasObservables )[1];

      } else if ( type === 'function' && isObservable ( value ) ) { // Observable

        if ( resolved !== DUMMY_RESOLVED ) resolved.push ( value );

        hasObservables = true;

      } else { // Something else

        if ( resolved !== DUMMY_RESOLVED ) resolved.push ( value );

      }

    }

    if ( resolved === DUMMY_RESOLVED ) resolved = values;

    return [resolved, hasObservables];

  };

  return ( values: any[] ): [any[], boolean] => {

    return resolveArraysAndStaticsInner ( values, DUMMY_RESOLVED, false );

  };

})();

/* EXPORT */

export {resolveChild, resolveClass, resolveResolved, resolveArraysAndStatics};
