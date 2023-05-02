# Markdown Show

This gem was created to allow me to run my own presentations.

I'm a big fan of markdown and I'd like to turn my simplest markdown files into
interactive presentations.

Features:

* Presentation mode: Breaks down all H1 as new slides. Hides rest of content and support keyboard navigation.
* Run SQL: Any SQL snippet from your markdown can be run in a backend server.
    Check for [demo-sql.md](./demo-sql.md) as an example.

## Installation

    $ gem install md-show

## Usage

    $ md-show your-md-file.md "postgres://0.0.0.0:5432/db"

The interesting part of this lib is the column auto detection which allows us to
just plot data detecting columns named as `x` and `y`. I initially built this tool
for my [data science workshop](https://github.com/jonatas/sql-data-science-training)
and now I'm making it available to allow me to use it in different scenarios.

Give a try and let me know what do you think create an issue with the feedback or
contributing with a pull request 🤓

## Development

After checking out the repo, run `bin/setup` to install dependencies.
Then, run `rake spec` to run the tests (Pending 😇).
You can also run `bin/console` for an interactive prompt that will allow you to experiment.

To install this gem onto your local machine, run `bundle exec rake install`. To release a new version, update the version number in `version.rb`, and then run `bundle exec rake release`, which will create a git tag for the version, push git commits and the created tag, and push the `.gem` file to [rubygems.org](https://rubygems.org).

- The backend is [/lib/md/show/app.rb]() which contains the web app.
- The frontend is [/public/main.js]() creates the magic in the frontend.
- The style is [/public/main.css]() with basic style.

The Markdown is using [Redcarpet](https://github.com/vmg/redcarpet)
The [public](./public) directory contains the front end files. The server is a
sinatra app just allowing to run the presentation.

The markdown 

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/jonatas/md-show. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [code of conduct](https://github.com/jonatas/md-show/blob/main/CODE_OF_CONDUCT.md).

## License

The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

## Code of Conduct

Everyone interacting in the Md::Show project's codebases, issue trackers, chat rooms and mailing lists is expected to follow the [code of conduct](https://github.com/jonatas/md-show/blob/main/CODE_OF_CONDUCT.md).
