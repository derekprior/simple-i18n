# simple-i18n

This is a jQuery plugin that is based on the seemingly-abandoned
[jquery-i18n-properties][1].


## Background

jquery-i18n-properties was already in use by my team when I joined, but I
quickly discovered number of issues that lead me to create our own fork and
then eventually to a complete rewrite. The library is inspired by
jquery-i18n-properties and carries over a number features, but is also jettisons
others. A rundown of the additions is in the source.

It's not meant to be 100% compatible; it's meant to be simpler and better
performing.

## Source

Our application does client-side lookups of i18n values using this library. That
means the `prop` method gets called hundreds of times on each page. When
writing the library I had to be cognizant of that. There are areas where I
seemingly go out of my way to do something perhaps a little awkward but thats
usually for performance reasons. I've tried to call those out with comments in
the code.

Is this premature optimization? No. We were actually having performance problems
with the original library.

## Tests

The tests are written in QUnit because that is what my team had chosen to
standardize on. I personally prefer Jasmine. Load runner.html to run the tests.

The tests rely on some some AJAX fixtures that I did not stub out. This means
you will have to run them on some server environment or otherwise work around
browser security prohibiting AJAX file access.

In our internal development and CI environments this isn't an issue.

## License

jquery-i18n-properties is dual licensed under the GPL and MIT licenses. My
rewrite is property of my employer and currently not open source in any way,
though I'm working with my employer on that.

[id]: http://code.google.com/p/jquery-i18n-properties/
