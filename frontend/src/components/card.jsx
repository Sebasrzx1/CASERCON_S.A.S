import * as React from "react";
import { cn } from "./utils";

// ==============================
// CARD BASE
// ==============================
function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border",
        className
      )}
      {...props}
    />
  );
}

// ==============================
// HEADER
// ==============================
function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid gap-1.5 px-6 pt-6",
        className
      )}
      {...props}
    />
  );
}

// ==============================
// TITLE
// ==============================
function CardTitle({ className, ...props }) {
  return (
    <h4
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

// ==============================
// DESCRIPTION
// ==============================
function CardDescription({ className, ...props }) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

// ==============================
// ACTION (botones en header)
// ==============================
function CardAction({ className, ...props }) {
  return (
    <div
      data-slot="card-action"
      className={cn("self-end", className)}
      {...props}
    />
  );
}

// ==============================
// CONTENT
// ==============================
function CardContent({ className, ...props }) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

// ==============================
// FOOTER
// ==============================
function CardFooter({ className, ...props }) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-6", className)}
      {...props}
    />
  );
}

// ==============================
// EXPORTS
// ==============================
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};