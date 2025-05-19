#!/bin/bash
export DOCKER_BUILDKIT=1

# Configuration variables
CAPTAIN_URL="https://captain.followingthesun.xyz/"
# Don't hardcode passwords in scripts - use environment variables instead
# CAPTAIN_PASSWORD will be pulled from environment or prompted

# Available apps
apps=("tours-backend")

# Function to check requirements
check_requirements() {
    if ! command -v caprover &>/dev/null; then
        echo "caprover is not installed. Please install it first."
        exit 1
    fi

    if ! command -v git &>/dev/null; then
        echo "git is not installed. Please install it first."
        exit 1
    fi
}

# Function to list apps
list_apps() {
    echo "Available apps:"
    for i in "${!apps[@]}"; do
        echo "$i) ${apps[$i]}"
    done
}

# Function to select app
select_app() {
    list_apps
    read -p "Choose an app from the list (0-${#apps[@]}): " app_number

    if ! [[ "$app_number" =~ ^[0-9]+$ ]] || [ "$app_number" -lt 0 ] || [ "$app_number" -ge "${#apps[@]}" ]; then
        echo "Invalid app number. Please choose a number from the list."
        exit 1
    fi

    selected_app=${apps[$app_number]}
    echo "Selected app: $selected_app"
    return 0
}

# Function to get captain password
get_password() {
    if [ -z "$CAPTAIN_PASSWORD" ]; then
        read -sp "Enter your CapRover password: " CAPTAIN_PASSWORD
        echo ""
    fi
}

# Main function
main() {
    check_requirements

    # Ask if user wants to commit changes
    read -p "Do you want to commit and push changes? (y/n): " should_commit
    if [ "$should_commit" = "y" ]; then
        read -p "Enter commit message: " commit_message
        git commit -am "$commit_message"
        git push
        echo "Changes committed and pushed"
    fi

    # Select the app to deploy
    select_app

    # Select the branch
    read -p "Deploy develop or current branch? (d/c): " env

    # Get password
    get_password

    # Deploy based on selected branch
    if [ "$env" = "d" ]; then
        echo "Deploying develop branch to $selected_app..."
        caprover deploy -h "$CAPTAIN_URL" -p "$CAPTAIN_PASSWORD" -b develop -a "$selected_app"
    elif [ "$env" = "c" ]; then
        current_branch=$(git branch --show-current)
        echo "Deploying $current_branch branch to $selected_app..."
        caprover deploy -h "$CAPTAIN_URL" -p "$CAPTAIN_PASSWORD" -b "$current_branch" -a "$selected_app"
    else
        echo "Invalid option. Please choose 'd' or 'c'."
        exit 1
    fi
}

# Run the script
main
