set shell := ["nu", "-c"]
set script-interpreter := ["nu"]
set unstable

import 'scripts/_shared.just'
import 'scripts/dev.just'
import 'scripts/test.just'
import 'scripts/check.just'
import 'scripts/deploy.just'
