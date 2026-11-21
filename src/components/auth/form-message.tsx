export function FieldError({
  id,
  children,
}: {
  id: string;
  children?: string;
}) {
  if (!children) {
    return null;
  }

  return (
    <p id={id} className="mt-1.5 text-xs leading-5 text-destructive">
      {children}
    </p>
  );
}

export function FormError({
  id,
  children,
}: {
  id?: string;
  children?: string;
}) {
  if (!children) {
    return null;
  }

  return (
    <div
      id={id}
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-5 text-destructive"
    >
      {children}
    </div>
  );
}
