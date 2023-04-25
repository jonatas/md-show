# frozen_string_literal: true

require_relative "show/version"
require_relative "show/app"

module Md
  module Show
    class Error < StandardError; end

    module_function
    def start!
      App.run!
    end
  end
end
