import { ApolloError } from '@apollo/client';

import { ErrorReason } from './enums';
import { CheckErrors, Error, Errors, SpecificErrors } from './types';

export const checkErrors: CheckErrors = (reason?: any) => (
  error: ApolloError
): any => {
  console.log(error);
  const { graphQLErrors, networkError } = error;

  const someGraphQLErrors = graphQLErrors && graphQLErrors.length > 0;

  const parsedErrors: Error[] = someGraphQLErrors
    ? graphQLErrors.map(({ message, extensions = {} }) => {
        const { exception } = extensions;

        return { message, ...exception };
      })
    : [];

  if (Array.isArray(reason)) {
    const errors: Errors = parsedErrors.reduce(
      (previousValue, currentValue) => {
        if (currentValue.reason) {
          return { ...previousValue, [currentValue.reason]: currentValue };
        }

        return previousValue;
      },
      {}
    );

    const areOtherErrors =
      parsedErrors.length - Object.keys(errors).length > 0 || networkError;

    const otherSpecificErrors = { ...errors };

    const specificErrors: SpecificErrors = (reason as ErrorReason[]).reduce(
      (previousValue, currentValue) => {
        if (errors[currentValue]) {
          delete otherSpecificErrors[currentValue];

          return {
            ...previousValue,
            [currentValue]: true
          };
        }

        return previousValue;
      },
      {}
    );

    const areOtherSpecificErrors = Object.keys(otherSpecificErrors).length > 0;

    const anyOtherErrors =
      areOtherErrors || areOtherSpecificErrors || networkError;

    return [specificErrors, anyOtherErrors];
  }

  const specificError = parsedErrors.some(
    (err: Error) => err.reason === reason
  );

  const areOtherErrors = specificError
    ? parsedErrors.length > 1
    : parsedErrors.length > 0;

  return [specificError, areOtherErrors];
};
