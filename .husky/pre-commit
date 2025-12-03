echo "🎯 Running lint-staged to check code style..."

case `uname` in
  *CYGWIN*|*MINGW*|*MSYS*)
    npx.cmd lint-staged # bug on Windows/Github Desktop: add `.cmd` extension fixes it
  ;;
  *)
    npx lint-staged
  ;;
esac
