#!/usr/bin/env ruby
# frozen_string_literal: true

require "fileutils"

begin
  require "xcodeproj"
rescue LoadError
  warn "Install the xcodeproj gem first: gem install xcodeproj --user-install"
  exit 1
end

ROOT = File.expand_path("..", __dir__)
PROJECT_PATH = File.join(ROOT, "TeamOSApps.xcodeproj")

def collect_swift_files(root, relative_dir)
  Dir.glob(File.join(root, relative_dir, "**", "*.swift")).sort.map do |path|
    path.delete_prefix("#{root}/")
  end
end

def apply_common_settings(target, bundle_id:, deployment_key:, deployment_version:, targeted_device_family: nil)
  target.build_configurations.each do |config|
    config.build_settings["PRODUCT_BUNDLE_IDENTIFIER"] = bundle_id
    config.build_settings["PRODUCT_NAME"] = "$(TARGET_NAME)"
    config.build_settings["SWIFT_VERSION"] = "6.0"
    config.build_settings["GENERATE_INFOPLIST_FILE"] = "YES"
    config.build_settings["CODE_SIGNING_ALLOWED"] = "NO"
    config.build_settings["CODE_SIGNING_REQUIRED"] = "NO"
    config.build_settings["DEVELOPMENT_TEAM"] = ""
    config.build_settings["LD_RUNPATH_SEARCH_PATHS"] = "$(inherited)"
    config.build_settings[deployment_key] = deployment_version
    config.build_settings["TARGETED_DEVICE_FAMILY"] = targeted_device_family if targeted_device_family
  end
end

def add_sources(project, target, source_group, file_paths)
  refs = file_paths.map { |relative_path| source_group.new_file(relative_path) }
  target.add_file_references(refs)
end

def create_shared_scheme(project, target)
  scheme = Xcodeproj::XCScheme.new
  scheme.add_build_target(target)
  scheme.set_launch_target(target)
  scheme.save_as(project.path, target.name, true)
end

FileUtils.rm_rf(PROJECT_PATH)
project = Xcodeproj::Project.new(PROJECT_PATH)
project.root_object.attributes["LastUpgradeCheck"] = "2640"

sources_group = project.main_group.new_group("Sources")

mac_target = project.new_target(:application, "TeamOSMacApp", :osx, "13.0")
ios_target = project.new_target(:application, "TeamOSiOSApp", :ios, "17.0")

apply_common_settings(
  mac_target,
  bundle_id: "com.teamos.TeamOSMacApp",
  deployment_key: "MACOSX_DEPLOYMENT_TARGET",
  deployment_version: "13.0"
)

apply_common_settings(
  ios_target,
  bundle_id: "com.teamos.TeamOSiOSApp",
  deployment_key: "IPHONEOS_DEPLOYMENT_TARGET",
  deployment_version: "17.0",
  targeted_device_family: "1,2"
)

core_sources = collect_swift_files(ROOT, "TeamOSCore/Sources/TeamOSCore")
shared_sources = collect_swift_files(ROOT, "AppShared")
mac_sources = collect_swift_files(ROOT, "TeamOSMacApp")
ios_sources = collect_swift_files(ROOT, "TeamOSiOSApp")

add_sources(project, mac_target, sources_group, core_sources + shared_sources + mac_sources)
add_sources(project, ios_target, sources_group, core_sources + shared_sources + ios_sources)

create_shared_scheme(project, mac_target)
create_shared_scheme(project, ios_target)

project.save
puts "Generated #{PROJECT_PATH}"
