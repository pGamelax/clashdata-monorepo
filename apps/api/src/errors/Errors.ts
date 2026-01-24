export class BadRequest extends Error {
  status = 400;

  constructor(public message: string) {
    super(message);
  }
}

export class Unauthorized extends Error {
  status = 401;

  constructor(public message: string) {
    super(message);
  }
}

export class Forbidden extends Error {
  status = 403;

  constructor(public message: string) {
    super(message);
  }
}

export class NotFound extends Error {
  status = 404;

  constructor(public message: string) {
    super(message);
  }
}
